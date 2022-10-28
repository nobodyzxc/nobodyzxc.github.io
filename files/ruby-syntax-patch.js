document.addEventListener("DOMContentLoaded", function(event) {
    var pre = document.getElementsByTagName("pre");
    for(var i = 0 ; i < pre.length ; i++){
        var commented = 0;
        for(var j = 0 ; j < pre[i].childNodes.length ; j++){
            if(pre[i].childNodes[j].firstChild){
                var code = String(pre[i].childNodes[j].firstChild.innerHTML);
                if(code.substring(0, 6) === "=begin" &&
                ((code.length <= 6) || (code[6] === ' '))){
                    commented += 1;
                }
            }
            if(commented > 0) pre[i].childNodes[j].className += " comment";
            if(pre[i].childNodes[j].innerHTML === "=end") commented -= 1;
        }
    }
});
