import { Tedis } from 'tedis';

export class Singleton {
    private static instance: Tedis;
    public getInstance(): Tedis {
        if (!Singleton.instance) {
            Singleton.instance = new Tedis({
                host: '127.0.0.1',
                port: 6379
            });
        }
        return Singleton.instance;
    }
}
