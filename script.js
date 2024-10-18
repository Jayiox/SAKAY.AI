let map;
let directionsService;
let directionsRenderer;
let autocompleteStart;
let autocompleteEnd;

//MAP INITIALISATION AND LAYOUT
document.addEventListener('DOMContentLoaded', function() {
    map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 14.5995, lng: 120.9842 },
    zoom: 12
 });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    const inputStart = document.getElementById('start');
    const inputEnd = document.getElementById('end');
    
    const options = {
    componentRestrictions: { country: 'ph' }
  };

    autocompleteStart = new google.maps.places.Autocomplete(inputStart, options);
    autocompleteEnd = new google.maps.places.Autocomplete(inputEnd, options);

    document.getElementById('route-form').addEventListener('submit', function(event) {
    event.preventDefault();
    calculateAndDisplayRoute();
    });

    document.getElementById('chat-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (message === '') return;

    addMessageToChatLog('You: ' + message);
    const response = await handleChatMessage(message);
    addMessageToChatLog('Assistant: ' + response);
    input.value = '';
    });
});

function calculateAndDisplayRoute() {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    directionsService.route(
    {
         origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
            displayRouteInfo(response);
            } else {
            window.alert('Directions request failed due to ' + status);
            }
        }
    );
}

function displayRouteInfo(response) {
    const resultsDiv = document.getElementById('results');
    const route = response.routes[0].legs[0];

    const routeDetails = `
    <p><strong>From:</strong> ${route.start_address}</p>
    <p><strong>To:</strong> ${route.end_address}</p>
    <p><strong>Distance:</strong> ${route.distance.text}</p>
    <p><strong>Duration:</strong> ${route.duration.text}</p>
    `;
    resultsDiv.innerHTML = routeDetails;
}
//AI FORMAT TO START DIRECTIONS GUIDE
async function handleChatMessage(message) {
    if (message.toLowerCase().includes('tell me the way from')) {
        const locations = message.match(/from (.+) to (.+)/i);
        if (locations) {
        const start = locations[1].trim();
        const end = locations[2].trim();
        const routeInfo = await getDirections(start, end);
        return routeInfo;
        } else {
          return 'Please provide a valid input in the format "Tell me the way from [Start] to [End]".';
        }
    } else {
        return await getChatbotResponse(message);
    }
}

async function getDirections(start, end) {
    return new Promise((resolve, reject) => {
      directionsService.route(
        {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING
        },
            (response, status) => {
               if (status === 'OK') {
                 directionsRenderer.setDirections(response);
                    const route = response.routes[0].legs[0];
                    const routeDetails = `
                    From: ${route.start_address}
                    To: ${route.end_address}
                    Distance: ${route.distance.text}
                    Duration: ${route.duration.text}
                    `;
                    setStartAndEndLocations(route.start_address, route.end_address);
                    resolve(routeDetails);
                } else {
                    resolve('Directions request failed due to ' + status);
                }
            }
        );
    });
}
//AI API IMPLEMENTATION
async function getChatbotResponse(message) { 
    const API_KEY = 'APIKEY';
    const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo-instruct',
            prompt: message,
            max_tokens: 150
        })
    });
    const data = await response.json();
    return data.choices[0].text.trim();
}

function addMessageToChatLog(message) {
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) {
      const chatbox = document.getElementById('chatbox');
      const newChatLog = document.createElement('div');
      newChatLog.id = 'chat-log';
      chatbox.insertBefore(newChatLog, chatbox.firstChild);
    }
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function setStartAndEndLocations(start, end) {
    document.getElementById('start').value = start;
    document.getElementById('end').value = end;
    calculateAndDisplayRoute();
}