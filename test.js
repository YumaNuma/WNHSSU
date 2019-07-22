const request = require('request')

request.post('http://192.168.1.14:81/events/addnew', {
    json: {
        name: 'Test',
        month: 'September',
        day: '23rd',
        time: '4:30',
        loc: "Auditorium",
        pn: '1'
    }
}, (error, res, body) => {
    if (error) {
        console.error(error)
        return
    }
    console.log(`statusCode: ${res.statusCode}`)
    console.log(body)
    })
request.post('http://192.168.1.14:81/events/addnew', {
    json: {
        name: 'Test 2',
        month: 'October',
        day: '25th',
        time: '2:25',
        loc: "Auditorium",
        pn: '2'
    }
}, (error, res, body) => {
    if (error) {
        console.error(error)
        return
    }
    console.log(`statusCode: ${res.statusCode}`)
    console.log(body)
    })
request.post('http://192.168.1.14:81/events/addnew', {
    json: {
        name: 'Test 3',
        month: 'August',
        day: '3rd',
        time: '7:30',
        loc: "Auditorium",
        pn: '3'
    }
}, (error, res, body) => {
    if (error) {
        console.error(error)
        return
    }
    console.log(`statusCode: ${res.statusCode}`)
    console.log(body)
})