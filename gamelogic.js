import {set, get, update, remove, ref, child, getDatabase }
from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

window.getQuestionData = getQuestionData;

let cardCont = document.getElementById("card-container");
localStorage.setItem("editingMode", false);

loadCategories();
loadQuestions();

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
        const maxSpins = 10; // you can tweak this
        let finalCategory = null;

        rouletteInterval = setInterval(() => {

            categories.forEach(cat => {
                const el = document.getElementById('category-title-' + cat);
                if (el) el.style.border = "none";
            });

            // 🎯 Pick random category
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];

            const el = document.getElementById('category-title-' + randomCategory);
            if (el) el.style.border = "2px solid yellow";

            finalCategory = randomCategory;
            count++;

            // 🛑 Stop condition
            if (count >= maxSpins) {
                clearInterval(rouletteInterval);
                rouletteInterval = null;

                console.log("Final category:", finalCategory);
            }

        }, 200); // speed (lower = faster)
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

function loadPlayerStats() {
    document.getElementById('player-stats').innerHTML = "";
    get(ref(db, '/Equipos')).then(data => {

        data.forEach(equipo => {
            document.getElementById('player-stats').innerHTML += `
                <div style="color: white; font-size: 20px; margin-bottom: 10px; flex-direction: row; display: flex; gap: 10px; align-items: center; background-color: rgb(205, 205, 205); padding: 10px; border-radius: 10px;">
                    <button onclick="updatePlayerScore('${equipo.key}')">+</button>    
                    <div style="display: flex; flex-direction: column; color: black;">    
                        <div style="font-weight: bold;">${equipo.val().Nombre}</div>
                        <div>Score: ${equipo.val().Puntos}</div>
                    </div>
                </div>
            `
        });
        
    })
}


function loadQuestions() { 
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

    get(ref(db, `/Categorias/${category}/${value}`)).then(data => {
        if (data.exists()) {

            if(data.val().Available == false) {
                console.log("Question already answered");
                return
            }

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

            // Mark question as unavailable
            update(ref(db, `/Categorias/${category}/${value}`), {
                Available: false
            });

            
              
        }
        
    })

    }
}

window.showAnswer = showAnswer;
function showAnswer() {
    document.getElementById("answer-text").style.visibility = "visible";
}
window.closeQuestionsPane = closeQuestionsPane;
function closeQuestionsPane() {

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

window.resetGame = resetGame;
function resetGame() {
    if(!confirm("Are you sure you want to reset the game? This will make all questions available again and reset all player scores.")){
        return
    }

    get(ref(db, '/Categorias')).then(data => {
        
        data.forEach(category => {

            category.forEach(question => {
                if(question.key != "catname") {
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
    let newQuestionText = prompt("Question text", "");
    let newAnswerText = prompt("Answer text", "");
    let newImage = prompt("Image url for reference (optional)")
    let value = prompt("Points value:")

    let updates = {};
        if(newQuestionText) updates['Q'] = newQuestionText;
        if(newAnswerText) updates['A'] = newAnswerText;
        if(newQuestionText) updates['Available'] = true;
        if(newImage) updates['ImageUrl'] = newImage;

        update(ref(db, `/Categorias/${category}/${value}`), updates);
        loadQuestions();
            

}