import type { IUser, IUserHasId } from '@growi/core/dist/interfaces';
import { serializeUserSecurely } from '@growi/core/dist/models/serializers';
import type { NextFunction, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

import loggerFactory from '~/utils/logger';

import type { AccessTokenParserReq } from './interfaces';

const logger = loggerFactory('growi:middleware:access-token-parser:api-token');

export const parserForApiToken = async(req: AccessTokenParserReq, res: Response, next: NextFunction): Promise<void> => {
  const accessToken = req.query.access_token ?? req.body.access_token;
  if (accessToken == null || typeof accessToken !== 'string') {
    return next();
  }

  logger.debug('accessToken is', accessToken);

  const User = mongoose.model<HydratedDocument<IUser>, { findUserByApiToken }>('User');
  const userByApiToken: IUserHasId = await User.findUserByApiToken(accessToken);

  if (userByApiToken == null) {
    return;
  }

  req.user = serializeUserSecurely(userByApiToken);
  if (req.user == null) {
    return;
  }

  logger.debug('Access token parsed.');
  return next();
};
