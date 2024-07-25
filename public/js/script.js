let signin = document.querySelector("#signin")
let login = document.querySelector("#login")
let btn = document.querySelector("#btn")

let a=0;
function change(){
    if(a==0){
        signin.style.display = "block";
        login.style.display = "none";
        btn.innerText = "Create An Account"
        a==1;
    }
    else if(a==1){
        signin.style.display = "block";
        login.style.display = "none";
        btn.innerText = "already have account?"
        a==0;
    }
}