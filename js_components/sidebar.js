// function navigate(page) {
//   document.getElementById("pageFrame").src = "../html_components/" + page;

//   // active class
//   document.querySelectorAll(".menu li").forEach(li => {
//     li.classList.remove("active");
//   });

//   event.target.closest("li").classList.add("active");
// }





// function navigate(page) {
//   if(page === 'login.html') {
//     // Hide sidebar on logout
//     document.querySelector('.sidebar').style.display = 'none';
//     document.getElementById('pageFrame').src = "../html_components/" + page;
//     return;
//   }

//   document.getElementById("pageFrame").src = "../html_components/" + page;

//   // active class
//   document.querySelectorAll(".menu li").forEach(li => {
//     li.classList.remove("active");
//   });

//   event.target.closest("li").classList.add("active");
// }


function navigate(page) {
  if(page === 'login.html') {
    // Redirect the whole window, not iframe
    window.location.href = "../html_components/" + page;
    return;
  }

  document.getElementById("pageFrame").src = "../html_components/" + page;

  // active class
  document.querySelectorAll(".menu li").forEach(li => {
    li.classList.remove("active");
  });

  event.target.closest("li").classList.add("active");
}
