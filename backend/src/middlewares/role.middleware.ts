import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción',
        requiredRoles: allowedRoles,
        currentRole: req.userRole
      });
      return;
    }

    next();
  };
};
