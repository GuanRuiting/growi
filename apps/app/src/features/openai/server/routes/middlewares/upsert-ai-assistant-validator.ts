import { GroupType } from '@growi/core';
import { isGlobPatternPath, isCreatablePage } from '@growi/core/dist/utils/page-path-utils';
import { type ValidationChain, body } from 'express-validator';

import { AiAssistantShareScope, AiAssistantAccessScope } from '../../../interfaces/ai-assistant';

export const upsertAiAssistantValidator: ValidationChain[] = [
  body('name')
    .isString()
    .withMessage('name must be a string')
    .not()
    .isEmpty()
    .withMessage('name is required')
    .escape(),

  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string')
    .escape(),

  body('additionalInstruction')
    .optional()
    .isString()
    .withMessage('additionalInstruction must be a string')
    .escape(),

  body('pagePathPatterns')
    .isArray()
    .withMessage('pagePathPatterns must be an array of strings')
    .not()
    .isEmpty()
    .withMessage('pagePathPatterns must not be empty'),

  body('pagePathPatterns.*') // each item of pagePathPatterns
    .isString()
    .withMessage('pagePathPatterns must be an array of strings')
    .notEmpty()
    .withMessage('pagePathPatterns must not be empty')
    .custom((value: string) => {

      // check if the value is a grob pattern path
      if (value.includes('*')) {
        return isGlobPatternPath(value) && isCreatablePage(value.replace('*', ''));
      }

      return isCreatablePage(value);
    }),

  body('grantedGroupsForShareScope')
    .optional()
    .isArray()
    .withMessage('grantedGroupsForShareScope must be an array'),

  body('grantedGroupsForShareScope.*.type') // each item of grantedGroupsForShareScope
    .isIn(Object.values(GroupType))
    .withMessage('Invalid grantedGroupsForShareScope type value'),

  body('grantedGroupsForShareScope.*.item') // each item of grantedGroupsForShareScope
    .isMongoId()
    .withMessage('Invalid grantedGroupsForShareScope item value'),

  body('grantedGroupsForAccessScope')
    .optional()
    .isArray()
    .withMessage('grantedGroupsForAccessScope must be an array'),

  body('grantedGroupsForAccessScope.*.type') // each item of grantedGroupsForAccessScope
    .isIn(Object.values(GroupType))
    .withMessage('Invalid grantedGroupsForAccessScope type value'),

  body('grantedGroupsForAccessScope.*.item') // each item of grantedGroupsForAccessScope
    .isMongoId()
    .withMessage('Invalid grantedGroupsForAccessScope item value'),

  body('shareScope')
    .isIn(Object.values(AiAssistantShareScope))
    .withMessage('Invalid shareScope value'),

  body('accessScope')
    .isIn(Object.values(AiAssistantAccessScope))
    .withMessage('Invalid accessScope value'),
];
