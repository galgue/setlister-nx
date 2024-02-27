import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
  }
  async onModuleInit() {
    await this.$connect();

    this.$extends({
      result: {
        artist: {
          songsCalculated: {
            needs: {
              nextShow: true,
              noNextShow: true,
            },
            compute(data) {
              return data.nextShow || data.noNextShow;
            },
          },
          needRecalculate: {
            needs: {
              nextShow: true,
            },
            compute(data) {
              return dayjs(data.nextShow).isBefore(dayjs());
            },
          },
        },
      },
    });
  }
}
