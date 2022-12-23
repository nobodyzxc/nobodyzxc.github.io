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

function showNotes(noteToShow = '', mode = 1, uncheck = 1){
  noteToShow = noteToShow.trim();
  if(!noteToShow || noteToShow == 'No'){
    if(uncheck) $('.selectNote').prop('checked', false);
    return $('.guitar-neck .notes li').css({opacity:0});
  }

  let sel = noteToShow == "All" ?
    $('.guitar-neck .notes li') :
    $(`.guitar-neck .notes li[note="${noteToShow}"]`);

  let opacity =  mode >= 0 ? mode :
    1 - sel.get().map(x => $(x).css('opacity'))
                 .some(x => x == '1');

  sel.animate({opacity}, 500);
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

function randomSelectNote(){
  return $('.selectNote:checked')
    .get().map(e =>
      e.nextSibling.textContent.trim())
      .random() || 'C';
}

var modeTick = -1;

var mode = {
  tick: -1,
  reset: function(){ this.tick = -1; },
  step: function(){
    mode.tick += 1;
    window[`_${$('#mode').val()}`]?.();
  }
}

var prevStrIdx = -1;
function _randomNote(){
  if (!mode.tick) {
    _randomNote.strIdx = -1;
    do { _randomNote.strIdx = getRandomInt(1, 7); }
    while(prevStrIdx > 0 && _randomNote.strIdx == prevStrIdx);
    prevStrIdx = _randomNote.strIdx;
    showNotes('', 0, 0);
    $('.strings > li').get().forEach(
      (e, i) => {
        $(e).css({
          opacity: Number(i == _randomNote.strIdx - 1)
        });
      });
    _randomNote.sel = randomSelectNote();
    $(`.open-notes li`).get().forEach(
      (e, i) => {
        $(e).text(i == _randomNote.strIdx - 1 ?
          _randomNote.sel : 'O');
      });
  }

  if (mode.tick == Number($('#modeInterval').val())) {
    // $('.guitar-neck .notes li')
    //   .not(`[note="${_randomNote.sel}"]`)
    //   .animate({opacity:0}, 500);
    $(`.guitar-neck .notes
      .mask:nth-child(${7 - _randomNote.strIdx})
      li[note="${_randomNote.sel}"]`)
      .animate({opacity:1}, 500);
  }

  if (mode.tick == Number($('#modeInterval').val())
                 + Number($('#answerTimeout').val())
                 - 1) {
    mode.tick = -1;
  }
}

function resetMode(){
  if(modeItvlID){
    clearInterval(modeItvlID);
    modeItvlID = null;
  }
}

function showNote(){
  $(`.strings > li`)
    .css({opacity: 1});
  changeOpenNotes();
}

function rerunMode(){
  resetMode();
  mode.reset();
  window[$('#mode').val()]?.();
  $('.mode-controls').hide();
  $(`.mode-controls-${$('#mode').val()}`).show();
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
        let opacity = Number($(`.selectNote[note="${nextNote}"]`).is(':checked'));
        el.find('ul').prepend( `<li style="opacity: ${opacity}" note="${nextNote}">${nextNote}</li>` );
        el.find('li:last-child').remove();
        el.css({right: -189 + noteOffset});
      }, slideSpeed+20)
    });

    setTimeout(function(){
      changeOpenNotes();
      // showNotes(noteToShow);
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

      let opacity = Number($(`.selectNote[note="${nextNote}"]`).is(':checked'));

      $( `<li style="opacity: ${opacity}" note="${nextNote}">${nextNote}</li>` ).appendTo(el.find('ul'));
      el.css({right: -268 + noteOffset});
      el.find('li:first-child').remove();
      el.animate({right: -189 + noteOffset}, slideSpeed);

    });

    changeOpenNotes();
    // showNotes(noteToShow);

    setTimeout(function(){
      canClick = true;
    }, slideSpeed+20)
    return false;
  });

  $('.controls li').click(function(){
    $(this).find('.selectNote').click();
    // noteToShow = $(this).text();
    // showNotes(noteToShow, -1);
  });

  $('.selectNote').click(function(event){
    event.stopPropagation();
    noteToShow = $(this).attr('note')

    if (noteToShow == 'All') {
      $('.selectNote').prop('checked', this.checked);
      $('.controls li').get().forEach(li => {
        showNotes($(li).text(), this.checked);
      });
    }
    else {
      let all = $('.selectNote').get()
        .every((box, idx) => box.checked || !idx)
      $($('.selectNote')[0]).prop('checked', all);
      return showNotes(noteToShow, this.checked);
    }
  });

  $('#mode').change(rerunMode).change();
  $('#modeInterval').change(rerunMode);
  $('#answerTimeout').change(rerunMode);
  $('#toggle-metronome').click(function(){
    $(".play-btn").click();
    $(this).text($(".play-btn").text());
  });
  (new MutationObserver(function(mutations){
    mutations.forEach(function(mutation) {
      $('#toggle-metronome').text($(".play-btn").text());
    });
  })).observe($(".play-btn")[0], { attributes: true });

  showNotes();

  // Get the modal
  var modal = document.getElementById("myModal");

  // Get the button that opens the modal
  var btn = document.getElementById("metronome");

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
