Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

var slideSpeed = 300;
var noteToShow = "All";
var canClick = true;

const noteOffset = 20;
var modeItvlID = null;

var notes = {
  e: ['E','F','F#','G','G#','A','A#','B','C','C#','D','D#','E'],
  a: ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#',"A"],
  d: ['D','D#','E','F','F#','G','G#','A','A#','B','C','C#','D'],
  g: ['G','G#','A','A#','B','C','C#','D','D#','E','F','F#','G'],
  b: ['B','C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
}

function showNotes(noteToShow = ''){
  noteToShow = noteToShow.trim();
  if(!noteToShow || noteToShow == 'No'){
    $('.guitar-neck .notes li')
      .css({opacity:0});
  }
  else if(noteToShow == "All"){
    $('.guitar-neck .notes li')
      .animate({opacity:1}, 500);
  } else {
    $('.guitar-neck .notes li')
      .not('[note="'+noteToShow+'"]')
      .animate({opacity:0}, 500);
    $('.guitar-neck .notes li[note="'+noteToShow+'"]')
      .animate({opacity:1}, 500);
  }
}

function changeOpenNotes(){
  $('.notes .mask').each(function(){
    var el = $(this);
    var elClass = el.attr('class').split(' ')[1];
    var note = el.find('li:last-child').text();
    $('.open-notes .'+elClass).text(note);
  });
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() *
    (max - min) + min);
  // The maximum is exclusive
  // and the minimum is inclusive
}

function getModeInterval(){
  return Number($('#modeInterval').val()) * 1000;
}

function getAnswerTimeout(){
  return Number($('#answerTimeout').val()) * 1000;
}

function randomSelectNote(){
  return $('.selectNote:checked')
    .get().map(e =>
      e.nextSibling.textContent.trim())
      .random() || 'C';
}

var prevStrIdx = -1;
function _randomNote(){

  let strIdx = -1;
  do { strIdx = getRandomInt(1, 7); }
  while(prevStrIdx > 0 && strIdx == prevStrIdx);

  prevStrIdx = strIdx;

  showNotes();
  $('.strings > li').get().forEach(
    (e, i) => {
      $(e).css({
        opacity: Number(i == strIdx - 1)
      });
    });
  let sel = randomSelectNote();
  $(`.open-notes li`).get().forEach(
    (e, i) => {
      $(e).text(i == strIdx - 1 ?
        sel : 'O');
    });
  setTimeout(() => {
    $('.guitar-neck .notes li')
      .not('[note="'+sel+'"]')
      .animate({opacity:0}, 500);
    $(`.guitar-neck .notes .mask:nth-child(${7 - strIdx}) li[note="${sel}"]`)
      .animate({opacity:1}, 500);
  }, getModeInterval());
}

function randomNote(){
  _randomNote();
  modeItvlID = setInterval(() => {
    _randomNote();
  }, getModeInterval() + getAnswerTimeout());
}

function resetMode(){
  if(modeItvlID){
    clearInterval(modeItvlID);
    modeItvlID = null;
  }
}

function showNote(){
  console.log('showNote')
  $(`.strings > li`)
    .css({opacity: 1});
  $('.open-notes li').get().forEach(e => {
    $(e).text($(e).attr('note'));
  });
}

$(document).ready(function(){

  for (var i=0; i < notes.e.length; i++){
    $('.mask.low-e ul')
      .append('<li note='+notes.e[i]+'>'+notes.e[i]+'</li>')
    $('.mask.a ul')
      .append('<li note='+notes.a[i]+'>'+notes.a[i]+'</li>')
    $('.mask.d ul')
      .append('<li note='+notes.d[i]+'>'+notes.d[i]+'</li>')
    $('.mask.g ul')
      .append('<li note='+notes.g[i]+'>'+notes.g[i]+'</li>')
    $('.mask.b ul')
      .append('<li note='+notes.b[i]+'>'+notes.b[i]+'</li>')
    $('.mask.high-e ul')
      .append('<li note='+notes.e[i]+'>'+notes.e[i]+'</li>')
    $('.mask').css({right: -189 + noteOffset})
  }

  $('.controls a.down').click(function(){
    if(!canClick){return false;}
    canClick = false;

    $('.mask').each(function(){
      var el = $(this);
      var nextNote = el.find('li:nth-child(12)').text();

      el.animate({right: -268 + noteOffset}, slideSpeed);
      setTimeout(function(){
        el.find('ul').prepend( "<li note="+nextNote+">"+nextNote+"</li>" );
        el.find('li:last-child').remove();
        el.css({right: -189 + noteOffset});
      }, slideSpeed+20)
    });

    setTimeout(function(){
      changeOpenNotes();
      showNotes(noteToShow);
      canClick = true;
    }, slideSpeed+20)

    return false;
  });

  $('.controls a.up').click(function(){
    if(!canClick){return false;}
    canClick = false;

    $('.mask').each(function(){
      var el = $(this);
      var nextNote = el.find('li:nth-child(2)').text();

      $( "<li note="+nextNote+">"+nextNote+"</li>" ).appendTo(el.find('ul'));
      el.css({right: -268 + noteOffset});
      el.find('li:first-child').remove();
      el.animate({right: -189 + noteOffset}, slideSpeed);

    });

    changeOpenNotes();
    showNotes(noteToShow);

    setTimeout(function(){
      canClick = true;
    }, slideSpeed+20)
    return false;
  });

  $('.controls li').click(function(){
    noteToShow = $(this).text();
    showNotes(noteToShow);
  });

  $('#mode').change(function(){
    resetMode();
    window[$(this).val()]?.();
  }).change();

  $('#modeInterval').change(function(){
    console.log("reset")
    resetMode();
    window[$('#mode').val()]?.();
  });

  $('#answerTimeout').change(function(){
    console.log("reset")
    resetMode();
    window[$('#mode').val()]?.();
  });
  showNotes();

  // Get the modal
  var modal = document.getElementById("myModal");

  // Get the button that opens the modal
  var btn = document.getElementById("myBtn");

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  // When the user clicks the button, open the modal 
  btn.onclick = function() {
    modal.style.display = "block";
  }

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
});
