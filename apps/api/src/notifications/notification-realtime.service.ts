import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, finalize } from 'rxjs';

export interface NotificationEvent {
  type: 'notification' | 'unread_count';
  payload: unknown;
}

@Injectable()
export class NotificationRealtimeService {
  private readonly logger = new Logger(NotificationRealtimeService.name);
  private readonly subjects = new Map<string, Set<Subject<NotificationEvent>>>();

  subscribe(userId: string): Observable<NotificationEvent> {
    const subject = new Subject<NotificationEvent>();
    if (!this.subjects.has(userId)) {
      this.subjects.set(userId, new Set());
    }
    this.subjects.get(userId)!.add(subject);
    this.logger.debug(`SSE subscriber added for user=${userId}`);

    return subject.asObservable().pipe(
      finalize(() => {
        const subs = this.subjects.get(userId);
        if (subs) {
          subs.delete(subject);
          if (subs.size === 0) this.subjects.delete(userId);
        }
        this.logger.debug(`SSE subscriber removed for user=${userId}`);
      }),
    );
  }

  emit(userId: string, event: NotificationEvent): void {
    const subs = this.subjects.get(userId);
    if (!subs || subs.size === 0) return;
    for (const subject of subs) {
      subject.next(event);
    }
  }

  emitToMany(userIds: string[], event: NotificationEvent): void {
    for (const userId of userIds) {
      this.emit(userId, event);
    }
  }
}
