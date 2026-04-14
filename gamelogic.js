import {set, get, update, remove, ref, child, getDatabase }
from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

window.getQuestionData = getQuestionData;

function getQuestionData(category, value) {

    get(ref(db, `/Categorias/${category}/${value}`)).then(data => {
        if (data.exists()) {

            if(data.val().Available == false) {
                console.log("Question already answered");
                return
            }

            let questionData = data.val().Q;
            let answer = data.val().A;

            console.log("Question: " + questionData);
            console.log("Answer: " + answer);

            // Mark question as unavailable
            update(ref(db, `/Categorias/${category}/${value}`), {
                Available: false
            });
            

        }
    })

}