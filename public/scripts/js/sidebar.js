let dashboard = document.getElementById('dashboard');
let header = document.querySelectorAll('.collapsible-header')[0];

dashboard.addEventListener('click', function(){
    if(header.classList[1] === 'active') {
        header.classList.remove('active');
    } else {
        header.classList.add('active');
    }
}, false);