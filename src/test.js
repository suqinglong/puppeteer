// const cheerio = require('cheerio');
// // const fs = require('fs');
// const dateformat = require('dateformat');
// console.log(dateformat('2020-04-21', 'mmm-dd'));

async function test(num) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('test resolve');
        }, num);
    });
}

await test(200)

// Atwater, CA
// Sumner, WA
// Cedar Falls, IA
// Green Bay, WI
// San Francisco, CA
// San Francisco, CA


// async function aa() {
//     await test(2000)
//     for (let i = 0; i < 10; i++) {
//         console.log('start' + i)
//         await test(2000)
//         console.log('end' + i)
//     }
//     console.log('done')
// }

// function bb() {
//     console.log('bb start');
//     [1, 2, 3].map(async item => {
//         console.log(await test(2000))
//     })
//     console.log('bb end');
// }

// let n = 0
// setInterval(() => {
//     console.log(n++)
// }, 100);

// bb()

// fs.readFile('./src/test.html', 'utf8', function (err, data) {
//     if (err) throw err;
//     const $ = cheerio.load(data);

//     // td data

//     const dataItemClass = [
//         '.age',
//         '.avail',
//         ['.truck', 'equipment'],
//         '.fp',
//         ['.do', 'origin_radius'],
//         '.origin',
//         '.trip',
//         ['.dest', 'destination'],
//         ['.dd', 'destination_radius'],
//         '.company',
//         '.contact',
//         '.length',
//         '.weight'
//     ];

//     dataItemClass.forEach((item) => {
//         let key;
//         let selector;
//         if (Array.isArray(item)) {
//             [selector, key] = item;
//         } else {
//             key = item.substr(1);
//             selector = item;
//         }
//         console.log(
//             key,
//             $(selector)
//                 .text()
//                 .replace(/\n/g, '')
//                 .replace(/\s{2,}/g, ' ')
//         );
//     });

//     // detail data
//     const arr = $('dl > dt, dl > dt + dd');
//     const key_value_arr = [];
//     arr.each((key, item) => {
//         key_value_arr.push(
//             $(item)
//                 .text()
//                 .trim()
//                 .replace(/\n/g, '')
//                 .replace(/\s{2,}/g, ' ')
//         );
//     });

//     const result = {};
//     for (let i = 0; i < key_value_arr.length; i += 2) {
//         result[key_value_arr[i]] = key_value_arr[i + 1];
//     }

//     const borkerToCarrierSpot = [
//         '.widget-title-incl-text',
//         '.widget-numbers-num',
//         '.widget-numbers-range'
//     ];

//     const borkerToCarrierSpotData = {
//         'Broker-to-Carrier Spot': borkerToCarrierSpot.map((item) => {
//             return $(item).text();
//         })
//     };

//     console.log(result, borkerToCarrierSpotData);
// });
