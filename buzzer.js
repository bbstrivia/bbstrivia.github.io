import {set, get, update, remove, ref, child, getDatabase, onValue}
from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

const url = new URL(location);
window.team = url.searchParams.get("team");
console.log(team)

document.getElementById('buzzer').addEventListener('click',()=>{

    get(ref(db, '/Dinamica/')).then(data => {
        if(data.val().equipo=="" && data.val().activequestion)
            update(ref(db, `/Dinamica/`),{'equipo': team} );
        else{
            console.log("someone beat you to it or question not active")
        }

    })
    
})


onValue(ref(db, '/Equipos'), (snapshot) => {

    snapshot.forEach(teamnum => {
        if(teamnum == team){
            document.getElementById('points').value = teamnum.val().points
        }
    });
    
});