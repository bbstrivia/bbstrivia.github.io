
import {set, get, update, remove, ref, child, getDatabase, onValue}
from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

localStorage.setItem('access',true)

const sound = new Audio('beep1.m4a');
const tick20 = new Audio('tick20.wav');

let myAudio = null;

function playTimer() {
    // Stop previous audio if needed
    if (myAudio) {
        myAudio.pause();
        myAudio.currentTime = 0;
    }

    myAudio = new Audio("tick20.wav");
    myAudio.play();
    console.log('playing')
}

function stopTimerSound() {
    if (myAudio) {
        myAudio.pause();
        console.log("stopping")
        myAudio.currentTime = 0;
    }
}

const buzzer = new Audio('ding.mp3');
const wrong = new Audio('wrong-answer-buzzer.mp3')

window.getQuestionData = getQuestionData;

window.showAnswer = showAnswer;
function showAnswer() {
    timer(0,false)
    update(ref(db, `/Dinamica/`),{'showAnswer': true} );
    update(ref(db, `/Dinamica/`),{'equipo': ''} );
    document.getElementById("answer-text").style.visibility = "visible";
}

let cardCont = document.getElementById("card-container");
localStorage.setItem("editingMode", false);

const url = new URL(location);
window.presenter = url.searchParams.get("presenter");
console.log(presenter)

loadCategories();
loadQuestions();

onValue(ref(db, '/Equipos'), (snapshot) => {
   loadPlayerStats()

});

onValue(ref(db, '/Dinamica/active-question/'), (snapshot) => {
    console.log("Question activated",snapshot.val())
    getQuestionData(snapshot.val().split('-')[0],snapshot.val().split('-')[1])

});

update(ref(db, `/Dinamica/`),{'activequestion': false} );
update(ref(db, `/Dinamica/`),{'equipo': ""} );

onValue(ref(db, '/Dinamica/closeQuestion'),(closeQuestion) =>{
    if(closeQuestion.val() == true){
        closeQuestionsPane()
        timer(0,false)
    }
})


onValue(ref(db, '/Dinamica/equipo'), (snapshot) => {
    if(snapshot.val()!=''){
        timer(5)
        buzzer.play()
    }
    else{
        timer(0,false)
    }
})


onValue(ref(db, '/Dinamica'), (snapshot) => {
    if (snapshot.val().equipo) {
        console.log(snapshot.val().equipo);
        loadPlayerStats(snapshot.val().equipo)
    }

    if(url.searchParams.get("presenter")=='true'){  
            const el = document.getElementById('category-title-' + snapshot.val().randomCat);
            if (el){
                    let categories = ['1','2','3','4','5','6']
                    categories.forEach(cat => {
                    const el = document.getElementById('category-title-' + cat);
                        if (el) el.style.background = "rgb(114, 0, 175)";el.style.color = "rgb(255, 255, 255)";
                        
                    });
                    el.style.background = "rgb(255,0,200)";el.style.color = "black";
                    sound.play()
                   
            }     }
    
});

window.toggleEditMode = toggleEditMode;
function toggleEditMode() {
    const isChecked = document.getElementById("edit-toggle").checked;
    localStorage.setItem("editingMode", isChecked);
    if(isChecked) {
        console.log("Editing mode enabled. Click on questions to edit them.");
    }
    loadQuestions();
}

window.randomSelectCategory = randomSelectCategory;
let rouletteInterval = null;

function randomSelectCategory() {
    if (rouletteInterval) {
        clearInterval(rouletteInterval);
        rouletteInterval = null;
    }

    get(ref(db, '/Categorias')).then(data => {
        let categories = [];

        data.forEach(category => {
            categories.push(category.key);
        });

        if (categories.length === 0) return;

        let count = 0;
        const maxSpins = 5; // you can tweak this
        let finalCategory = null;

        rouletteInterval = setInterval(() => {

            categories.forEach(cat => {
                const el = document.getElementById('category-title-' + cat);
                if (el) el.style.background = "rgb(114, 0, 175)";el.style.color = "rgb(255, 255, 255)";
                
            });

            // 🎯 Pick random category
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];

            const el = document.getElementById('category-title-' + randomCategory);
            if (el){
                    el.style.background = "rgb(255,0,200)";el.style.color = "black";
                    sound.play();

            } 

            finalCategory = randomCategory;
            count++;

            // 🛑 Stop condition
            if (count >= maxSpins) {
                clearInterval(rouletteInterval);
                rouletteInterval = null;

                console.log("Final category:", finalCategory);
                console.log(data.val()[finalCategory].catname)

                update(ref(db, `/Dinamica/`), {
                    randomCat: finalCategory
                });
                
            }

        }, 500); // speed (lower = faster)
    });
}

function loadCategories() { 

    get(ref(db, '/Categorias')).then(data => {

        data.forEach(category => {
            document.getElementById('category-title-'+category.key).innerHTML += `
                <h2 style="color: white;">${category.val().catname}</h2>
            `
        });
        
    })
}

loadPlayerStats();
localStorage.setItem("currentPoints", 0);

window.updatePlayerScore = updatePlayerScore;
function updatePlayerScore(playerId) {
    if(Number(localStorage.getItem('currentPoints'))==0){
        return
    }
    get(ref(db, `/Equipos/${playerId}`)).then(data => {
        if (data.exists()) {
            let currentScore = data.val().Puntos;
            update(ref(db, `/Equipos/${playerId}`), {
                Puntos: Number(currentScore) + Number(localStorage.getItem("currentPoints") )
            });
            loadPlayerStats();
            localStorage.setItem("currentPoints", 0);
        }
    })
}

function loadPlayerStats(playerActive) {
    
    get(ref(db, '/Equipos')).then(data => {

    document.getElementById('player-stats').innerHTML = "";
        data.forEach(equipo => {

            

            document.getElementById('player-stats').innerHTML += `
                <div style="color: ${playerActive == equipo.key ? 'white' : 'black'}; font-size: 20px; margin-bottom: 10px; flex-direction: row; display: flex; gap: 10px; align-items: center; width: 100px; background-color: ${playerActive == equipo.key ? 'rgb(255, 0, 208)' : 'white'}; padding: 10px; border-radius: 10px; min-width: 150px;">
                    <button onclick="updatePlayerScore('${equipo.key}')">+</button>    
                    <div style="display: flex; flex-direction: row; color: black; gap: 10px; ">    
                        <div style="font-weight: bold; color: ${playerActive == equipo.key ? 'white' : 'black'}; ">${equipo.val().Nombre}: </div>
                        <div style="font-size: 24px; color: ${playerActive == equipo.key ? 'white' : 'black'};">${equipo.val().Puntos}</div>
                    </div>
                </div>
            `
        });
        
    })
}


function loadQuestions() { 

    if(localStorage.getItem('access') == false){
            return
    }

    get(ref(db, '/Categorias')).then(data => {
        
        data.forEach(category => {
            document.getElementById('questions-column-'+category.key).innerHTML = "";

            category.forEach(question => {
                if(question.key != "catname") {
                    document.getElementById('questions-column-'+category.key).innerHTML += `<div id="cat-${category.key}-${question.key}" class="question-title" style="background-color: ${question.val().Available ? 'white' : 'gray'};" onclick="getQuestionData('${category.key}', '${question.key}')">
                        ${question.key}
                    </div>
                    `
                }
            })
            // After loading questions, check if we're in editing mode and if so, add hover effects
            if(localStorage.getItem("editingMode") == "true") {
                document.getElementById('questions-column-'+category.key).innerHTML += `<div id="cat-${category.key}-add" class="question-title-add" onclick="addNewQuestion('${category.key}')">
                        + New Question
                    </div>
                    `
            };
        })
            

            
        })
}

function getQuestionData(category, value) {
  
   if(localStorage.getItem("editingMode") == "true") {
       let newQuestionText = prompt("Edit question text (leave blank to keep current):", "");
        let newAnswerText = prompt("Edit answer text (leave blank to keep current):", "");

        let newImageSrc = prompt("Edit reference image");
            
        let updates = {};
        if(newQuestionText) updates['Q'] = newQuestionText;
        if(newAnswerText) updates['A'] = newAnswerText;
        if(newAnswerText) updates['ImageUrl'] = newImageSrc;

        update(ref(db, `/Categorias/${category}/${value}`), updates);

        loadQuestions();
    }
   else{
    update(ref(db, `/Dinamica/`), {'active-question':`${category}-${value}`});
    update(ref(db, `/Dinamica/`),{'closeQuestion': false} );

    get(ref(db, `/Categorias/${category}/${value}`)).then(data => {
        if (data.exists()) {

            document.getElementById(`cat-${category}-${value}`).style.backgroundColor = "gray"; 
            document.getElementById('question-text').innerText = "";
            document.getElementById('answer-text').innerText = "";
            document.getElementById('question-image').innerHtml = "";
            document.getElementById('question-pane').transition= "2";
            document.getElementById("question-pane").style.padding = "20px";
            document.getElementById('question-pane').style.visibility = "visible";
            document.getElementById('question-pane').style.height = "70vh";

            document.getElementById('question-pane').style.marginBottom = "200px";
            let questionData = data.val().Q;
            
            if(data.val().ImageUrl != "" && data.val().ImageUrl != undefined){
                let questionImg = `<img src="${data.val().ImageUrl}" alt="" height="300">`;
                document.getElementById("question-image").innerHTML = questionImg;
            }
            else{
                let questionImg = ``;

                document.getElementById("question-image").innerHTML = "";
            }
            
            let answer = data.val().A;

            localStorage.setItem("currentPoints", value);

            console.log("Question: " + questionData);
            console.log("Answer: " + answer);   
            document.getElementById("question-title-text").innerText = `For ${value} points:`;
            document.getElementById("question-text").innerText = questionData;
            document.getElementById("answer-text").style.visibility = "hidden";
            document.getElementById("answer-text").innerText = answer;

            timer(20)
            playTimer()

            if(url.searchParams.get("presenter")=='true'){  
                document.getElementById("answer-text").style.visibility = "visible";
            }


            update(ref(db, `/Dinamica/`),{'activequestion': true} );
            update(ref(db, `/Dinamica/`),{'equipo': ""} );

             // Mark question as unavailable
            update(ref(db, `/Categorias/${category}/${value}`), {
                Available: false
            });
            
              
        }
        
    })

    }
}



window.closeQuestionsPane = closeQuestionsPane;
function closeQuestionsPane() {

    update(ref(db, `/Dinamica/`),{'activequestion': false} );
    update(ref(db, `/Dinamica/`),{'closeQuestion': true} );
    update(ref(db, `/Dinamica/`),{'showAnswer': false} );
    update(ref(db, `/Dinamica/`),{'equipo': ''} );

    loadPlayerStats()

    localStorage.setItem("currentPoints", 0);
    document.getElementById('question-text').innerText = "";
    document.getElementById('answer-text').innerText = "";
    document.getElementById('question-image').innerHTML = "";
    document.getElementById('question-pane').transition= "2";
    document.getElementById('question-pane').style.padding = "0px";
    document.getElementById('question-pane').style.height = "0px";
    document.getElementById('question-pane').style.marginBottom = "0px";
    document.getElementById('question-pane').style.visibility = "hidden";

    
}

window.setEquipoNull = setEquipoNull
function setEquipoNull(){
            update(ref(db, `/Dinamica/`),{'equipo': ''} );
            loadPlayerStats()
            timer(20)

}

window.resetGame = resetGame;
function resetGame() {
    if(!confirm("Are you sure you want to reset the game? This will make all questions available again and reset all player scores.")){
        return
    }

    get(ref(db, '/Categorias')).then(data => {
        
        data.forEach(category => {

            category.forEach(question => {
                if(question.key != "catname") {

                    update(ref(db, `/Dinamica/`),{'equipo': '','active-question':'','showAnswer':false,'closeQuestion':''} );
                    
                    update(ref(db, `/Categorias/${category.key}/${question.key}`), {
                        Available: true
                    });
                }
            })
        });
    loadQuestions()
    })

    get(ref(db, '/Categorias')).then(data => {
        
        data.forEach(equipo => {
            update(ref(db, `/Equipos/${equipo.key}`), {
                Puntos: 0
            });
            
        });
        loadPlayerStats();
    })
    
              
           

}
window.addNewQuestion = addNewQuestion;

function addNewQuestion(category){
    let value = prompt("Points value:")
    let newQuestionText = prompt("Question text", "");
    let newAnswerText = prompt("Answer text", "");
    let newImage = prompt("Image url for reference (optional)")
    

    let updates = {};
        if(newQuestionText) updates['Q'] = newQuestionText;
        if(newAnswerText) updates['A'] = newAnswerText;
        if(newQuestionText) updates['Available'] = true;
        if(newImage) updates['ImageUrl'] = newImage;

        update(ref(db, `/Categorias/${category}/${value}`), updates);
        loadQuestions();
            

}

onValue(ref(db, '/Dinamica/showAnswer'),(showAnswer) =>{
    if(showAnswer.val() == true){
        document.getElementById('answer-text').style.visibility = 'visible'
        timer(0,false)
    }
})


let timerInterval = null;

function timer(seconds,buzz = true) {
    // Clear previous timer
    if (timerInterval !== null) {
        clearInterval(timerInterval);
    }

    const duration = seconds * 1000; // convert to ms
    const startTime = Date.now();

    timerInterval = setInterval(function () {
        const elapsed = Date.now() - startTime;
        const remaining = duration - elapsed;

        if(remaining > 0 && remaining < 100){
            
        }
        if (remaining <= 0) {
            stopTimerSound()
            if(buzz){wrong.play()}
            document.getElementById('safeTimerDisplay').style.color = 'white';
            update(ref(db, `/Dinamica/`),{'equipo': ''} );
            clearInterval(timerInterval);
            timerInterval = null;
            document.getElementById('safeTimerDisplay').innerHTML = "00:00:000";
            loadPlayerStats()

            return;
        }

        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const ms = remaining % 1000;

        if(Number(secs) <= 5 ){
            document.getElementById('safeTimerDisplay').style.color = 'red';
        } 
        else{
            document.getElementById('safeTimerDisplay').style.color = 'white';
        }

        document.getElementById('safeTimerDisplay').innerHTML =
            String(mins).padStart(2, '0') + ':' +
            String(secs).padStart(2, '0') + ':' +
            String(ms).padStart(3, '0');

    }, 50); // update every 50ms (smooth enough, not too heavy)
}