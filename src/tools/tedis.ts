import { Tedis } from 'tedis';

export class SingletonTedis {
    private static instance: Tedis;
    public getInstance(): Tedis {
        if (!SingletonTedis.instance) {
            SingletonTedis.instance = new Tedis({
                host: '127.0.0.1',
                port: 6379
            });
        }
        return SingletonTedis.instance;
    }
}
