async function test1() {
    try {
        await new Promise((resolve, reject) => {
            reject(new Error('error'));
        });
    } catch (e) {
        console.log('error', e);
    }
}

test1();
