const app = document.getElementById('app');

window.onload = function() {
  document.addEventListener("contextmenu", function(e){
    e.preventDefault();
  }, false);
};

app.addEventListener('click', () => {
  alert('click izquierdo')
});