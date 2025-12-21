import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { asyncLocalStorage } from '../prisma/prisma.service';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Вызываем базовую проверку JWT
    const result = super.canActivate(context);
      
    // Если результат - Promise, обрабатываем асинхронно
    if (result instanceof Promise) {
      return result.then((isValid) => {
        if (isValid) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        
        if (user?.id) {
            // Сохраняем userId в AsyncLocalStorage для использования в запросах
            asyncLocalStorage.enterWith({ userId: user.id });
          }
        }
        return isValid;
      });
      }
      
    // Если результат - Observable или boolean, возвращаем как есть
      return result;
  }
}


