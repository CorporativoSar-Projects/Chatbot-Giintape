function makeHttpObject() {
    if ('XMLHttpRequest' in window)
        return new XMLHttpRequest();
    else if ('ActiveXObject' in window)
        return new ActiveXObject('Msxml2.XMLHTTP');
}

var request = makeHttpObject();
request.open('GET', 'https://chatbot.giintapeinnovahue.com/inicializandoChatbot.html', true);
request.send(null);

request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status === 200) {
        var i = request.responseText;
        console.log(request.responseText);
        
        document.body.innerHTML = i;
        var chatbotScript = document.createElement('script');
        chatbotScript.src = 'https://chatbot.giintapeinnovahue.com/script.js';
        
        chatbotScript.onload = function() {
            console.log('El script del chatbot se ha cargado correctamente.');
        };
        
        document.body.appendChild(chatbotScript);
    }
};
