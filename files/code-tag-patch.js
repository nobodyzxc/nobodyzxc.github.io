// <code> tag is too close to <p> tag
// use`!`syntax sugar -> use `!` syntax sugar
document.addEventListener("DOMContentLoaded", function(event) {
    var codetags = document.getElementsByTagName("code");
    for(var i = 0 ; i < codetags.length ; i++){
        var par = codetags[i].parentElement;
        var str = par.innerHTML;
        var regex=/\S<code>/g;
        var match;
        while(match = regex.exec(str)){
            var pos = regex.lastIndex - match[0].length + 1;
            str = str.slice(0 , pos) + ' ' + str.slice(pos);
        }
        regex=/<\/code>\S/g;
        while(match = regex.exec(str)){
            var pos = regex.lastIndex - 1;
            str = str.slice(0 , pos) + ' ' + str.slice(pos);
        }
        par.innerHTML = str;
    }
});
