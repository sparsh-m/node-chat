var socket = io()

// socket.on('countUpdate', (count)=>{
//     console.log("Count Updated", count)
// })

// document.querySelector('#increment').addEventListener('click', ()=>{
//     socket.emit('incremented')
// })

//elements
const $messageForm = document.querySelector('#chatbox')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector(['#messages'])

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (message)=>{
    console.log(message.text)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message:message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (geo)=>{
    console.log(geo)
    const htmlLocation = Mustache.render(locationTemplate, {
        username: geo.username,
        url:geo.url,
        createdAt:moment(geo.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', htmlLocation)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error)=>{
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log("Message Delivered!")
    })
})

$locationButton.addEventListener('click', (e)=>{
    e.preventDefault()
    $locationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
        }, ()=>{
            console.log('Coords delivered!')
            $locationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {
    username,
    room
}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})