// const cheerio = require('cheerio');
// const fs = require('fs');
const dateformat = require('dateformat')
console.log(dateformat(new Date(), 'mmm-dd'))

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
