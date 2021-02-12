var passwordBox = document.querySelector('#passwordBox');
var nameBox = document.querySelector('#nameBox');
var loginBtn = document.querySelector('#login');

function afterResp(response){
    if(response != 'Correct password.'){
        alert(response);
    }
    window.location = 'http://76.176.77.192:8080/crypt';
}

function login(){
    fetch(`http://76.176.77.192:8080/login?password=${passwordBox.value}&name=${nameBox.value}`, {
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