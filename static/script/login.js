function toggleVisibility(id) {
    inp = document.getElementById(id);
    
    if (inp !== null && inp.tagName.toLowerCase() === 'input')
        inp.type = inp.type === 'password' ? 'text' : 'password';
}