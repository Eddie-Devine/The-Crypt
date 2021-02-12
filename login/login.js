var passwordBox = document.querySelector('#passwordBox');
var nameBox = document.querySelector('#nameBox');
var loginBtn = document.querySelector('#login');

function afterResp(response){
    if(response != 'Correct password.'){
        alert(response);
    }
    window.location = 'https://infinite-fjord-28854.herokuapp.com/crypt';
}

function login(){
    fetch(`https://infinite-fjord-28854.herokuapp.com/login?password=${passwordBox.value}&name=${nameBox.value}`, {
        method: 'POST'
    })
    .then(response => response.text())
    .then(response => afterResp(response));
}

loginBtn.addEventListener('click', function(){
    login();
});

passwordBox.addEventListener('keydown', function(event){
    if(event.keyCode == 13){
        login();
    }
});