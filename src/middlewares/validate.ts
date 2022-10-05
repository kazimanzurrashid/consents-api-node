import type { Schema } from 'joi';

import type { NextFunction, Request, Response } from 'express';

export default function validate(schema: Schema) {
  return function validateMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const { value, error } = schema.validate(req.body);

    if (error) {
      res.status(422).json({
        errors: error.details.map((d) => d.message)
      });
      return;
    }

    req.body = value;
    next();
  };
}
