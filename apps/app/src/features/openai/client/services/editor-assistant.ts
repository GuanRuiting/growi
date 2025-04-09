import {
  useCallback, useEffect, useState, useRef,
} from 'react';

import { GlobalCodeMirrorEditorKey } from '@growi/editor';
import { acceptChange, rejectChange } from '@growi/editor/dist/client/services/unified-merge-view';
import { useCodeMirrorEditorIsolated } from '@growi/editor/dist/client/stores/codemirror-editor';
import { useSecondaryYdocs } from '@growi/editor/dist/client/stores/use-secondary-ydocs';

import {
  SseMessageSchema,
  SseDetectedDiffSchema,
  SseFinalizedSchema,
  isReplaceDiff,
  // isInsertDiff,
  // isDeleteDiff,
  // isRetainDiff,
  type SseMessage,
  type SseDetectedDiff,
  type SseFinalized,
} from '~/features/openai/interfaces/editor-assistant/sse-schemas';
import { handleIfSuccessfullyParsed } from '~/features/openai/utils/handle-if-successfully-parsed';
import { useIsEnableUnifiedMergeView } from '~/stores-universal/context';
import { useCurrentPageId } from '~/stores/page';

interface PostMessage {
  (threadId: string, userMessage: string, markdown: string): Promise<Response>;
}
interface ProcessMessage {
  (data: unknown, handler: {
    onMessage: (data: SseMessage) => void;
    onDetectedDiff: (data: SseDetectedDiff) => void;
    onFinalized: (data: SseFinalized) => void;
  }): void;
}

type DetectedDiff = Array<{
  data: SseDetectedDiff,
  applied: boolean,
  id: string,
}>

const insertTextAtLine = (ytext, lineNumber: number, textToInsert: string): void => {
  // Get the entire text content
  const content = ytext.toString();

  // Split by newlines to get all lines
  const lines = content.split('\n');

  // Calculate the index position for insertion
  let insertPosition = 0;

  // Sum the length of all lines before the target line (plus newline characters)
  for (let i = 0; i < lineNumber && i < lines.length; i++) {
    insertPosition += lines[i].length + 1; // +1 for the newline character
  }

  // Insert the text at the calculated position
  ytext.insert(insertPosition, textToInsert);
};


const getLineInfo = (ytext, lineNumber: number): { text: string, startIndex: number, endIndex: number } | null => {
  // Get the entire text content
  const content = ytext.toString();

  // Split by newlines to get all lines
  const lines = content.split('\n');

  // Check if the requested line exists
  if (lineNumber < 0 || lineNumber >= lines.length) {
    return null; // Line doesn't exist
  }

  // Get the text of the specified line
  const text = lines[lineNumber];

  // Calculate the start index of the line
  let startIndex = 0;
  for (let i = 0; i < lineNumber; i++) {
    startIndex += lines[i].length + 1; // +1 for the newline character
  }

  // Calculate the end index of the line (exclusive)
  const endIndex = startIndex + text.length;

  // Return comprehensive line information
  return {
    text,
    startIndex,
    endIndex,
  };
};


export const useEditorAssistant = (): {postMessage: PostMessage, processMessage: ProcessMessage, accept: () => void, reject: () => void } => {
  // const positionRef = useRef<number>(0);
  const lineRef = useRef<number>(0);

  const [detectedDiff, setDetectedDiff] = useState<DetectedDiff>();

  const { data: currentPageId } = useCurrentPageId();
  const { data: isEnableUnifiedMergeView, mutate: mutateIsEnableUnifiedMergeView } = useIsEnableUnifiedMergeView();
  const { data: codeMirrorEditor } = useCodeMirrorEditorIsolated(GlobalCodeMirrorEditorKey.MAIN);
  const ydocs = useSecondaryYdocs(isEnableUnifiedMergeView ?? false, { pageId: currentPageId ?? undefined, useSecondary: isEnableUnifiedMergeView ?? false });

  const postMessage: PostMessage = useCallback(async(threadId, userMessage, markdown) => {
    const response = await fetch('/_api/v3/openai/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId,
        userMessage,
        markdown,
      }),
    });
    return response;
  }, []);

  const processMessage: ProcessMessage = useCallback((data, handler) => {
    handleIfSuccessfullyParsed(data, SseMessageSchema, (data: SseMessage) => {
      handler.onMessage(data);
    });
    handleIfSuccessfullyParsed(data, SseDetectedDiffSchema, (data: SseDetectedDiff) => {
      mutateIsEnableUnifiedMergeView(true);
      setDetectedDiff((prev) => {
        const newData = { data, applied: false, id: crypto.randomUUID() };
        if (prev == null) {
          return [newData];
        }
        return [...prev, newData];
      });
      handler.onDetectedDiff(data);
    });
    handleIfSuccessfullyParsed(data, SseFinalizedSchema, (data: SseFinalized) => {
      handler.onFinalized(data);
    });
  }, [mutateIsEnableUnifiedMergeView]);

  const accept = useCallback(() => {
    acceptChange(codeMirrorEditor?.view);
    mutateIsEnableUnifiedMergeView(false);
  }, [codeMirrorEditor?.view, mutateIsEnableUnifiedMergeView]);

  const reject = useCallback(() => {
    rejectChange(codeMirrorEditor?.view);
    mutateIsEnableUnifiedMergeView(false);
  }, [codeMirrorEditor?.view, mutateIsEnableUnifiedMergeView]);

  useEffect(() => {

    const pendingDetectedDiff: DetectedDiff | undefined = detectedDiff?.filter(diff => diff.applied === false);
    if (ydocs?.secondaryDoc != null && pendingDetectedDiff != null && pendingDetectedDiff.length > 0) {

      // For debug
      // const testDetectedDiff = [
      //   {
      //     data: { diff: { retain: 9 } },
      //     applied: false,
      //     id: crypto.randomUUID(),
      //   },
      //   {
      //     data: { diff: { delete: 5 } },
      //     applied: false,
      //     id: crypto.randomUUID(),
      //   },
      //   {
      //     data: { diff: { insert: 'growi' } },
      //     applied: false,
      //     id: crypto.randomUUID(),
      //   },
      // ];

      const ytext = ydocs.secondaryDoc.getText('codemirror');
      ydocs.secondaryDoc.transact(() => {
        pendingDetectedDiff.forEach((detectedDiff) => {
          if (isReplaceDiff(detectedDiff.data)) {
            const lineInfo = getLineInfo(ytext, lineRef.current);
            if (lineInfo != null && lineInfo.text !== detectedDiff.data.diff.replace) {
              ytext.delete(lineInfo.startIndex, lineInfo.text.length);
              insertTextAtLine(ytext, lineRef.current, detectedDiff.data.diff.replace);
            }

            lineRef.current += 1;
          }
          // if (isInsertDiff(detectedDiff.data)) {
          //   ytext.insert(positionRef.current, detectedDiff.data.diff.insert);
          // }
          // if (isDeleteDiff(detectedDiff.data)) {
          //   ytext.delete(positionRef.current, detectedDiff.data.diff.delete);
          // }
          // if (isRetainDiff(detectedDiff.data)) {
          //   positionRef.current += detectedDiff.data.diff.retain;
          // }
        });
      });

      // Mark as applied: true after applying to secondaryDoc
      setDetectedDiff((prev) => {
        const pendingDetectedDiffIds = pendingDetectedDiff.map(diff => diff.id);
        prev?.forEach((diff) => {
          if (pendingDetectedDiffIds.includes(diff.id)) {
            diff.applied = true;
          }
        });
        return prev;
      });

      // Set detectedDiff to undefined after applying all detectedDiff to secondaryDoc
      if (detectedDiff?.filter(detectedDiff => detectedDiff.applied === false).length === 0) {
        setDetectedDiff(undefined);
        lineRef.current = 0;
        // positionRef.current = 0;
      }
    }
  }, [codeMirrorEditor, detectedDiff, ydocs?.secondaryDoc]);

  return {
    postMessage,
    processMessage,
    accept,
    reject,
  };
};
