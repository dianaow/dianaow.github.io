$(document).ready(function(){

  $square = $(".square");
  $row = $(".row");
  $gameBoard=$("#gameBoard");
  $reset=$(".reset");
  $1=$("#1");
  $2=$("#2");
  $3=$("#3");
  $4=$("#4");
  $5=$("#5");
  $6=$("#6");
  $7=$("#7");
  $8=$("#8");
  $9=$("#9");

  var player1, player2;
  var arrX, arrO, emptySlots;
  var xo, flip, gameOver; 
  var turnCount=0;
  var winning=[[1,2,3],[4,5,6],[7,8,9],[1,4,7],[2,5,8],[3,6,9],[1,5,9],[3,5,7]];
   

  initiateGame();  
  function initiateGame(){
    gameOver=false;
    arrX=[];
    arrO=[];
    emptySlots=[1,2,3,4,5,6,7,8,9];
    turnCount=0;
    wipeBoard();
    $square.hide(); // hide tic tac toe board until player selects marker choice
    $("h4").hide(); // message bar
    $("h1").show(); // title 
    $("h3").show(); // marker selection bar
    $(".reset").hide(); // reset button
    }  
  
  $(".choice").click (function(){
    var choice=$(this);
    if (choice.hasClass("x")){
          player1="X";
          xo="X";
        } else {
          player1="O";
          xo="O";
        }
    flip=1; // player 1's turn
    $("h3").hide();
    $("h1").hide();
    $("h2").hide();    
    $square.show();  
    $("h4").html("<br/>Player 1's Turn<br/><br/>");
    $("h4").show();
    currentTurn()
  });  
  
  function currentTurn(){
    $square.click (function(){
      var selected=$(this);
      var id=parseInt($(this).attr("id")); // identify grid number clicked on by player
      if (gameOver) {$("h4").html("<br/>Game Over - Please Click Reset.<br/>"); } 
      else if(emptySlots.indexOf(id)==-1){
        $("h4").html("<br/>Spot Already Taken. Select another spot.");
        checkMaxMoves();
      } else {
        selected.text(xo);
        emptySlots.splice(emptySlots.indexOf(id),1); // update the list of empty slots (available playing space left)
        if (xo =="X") {
          arrX.push(id);
          checkWinning(arrX);
        } else {
          arrO.push(id);
          checkWinning(arrO);      
        } 
        nextTurn();            
      }
    })
  }

  function nextTurn(){
    if (!gameOver){
      turnCount++;    
      xo=="X" ? xo="O" : xo="X";// switch between X and O
      flip==1?flip=2:flip=1; // switch player
      $("h4").html("<br/>Player "+ flip +"'s Turn<br/><br/>");  
    } 
  }  

  function checkMaxMoves(){
      if (turnCount>8 && gameOver==false) {
      $("h4").html("<br/>It's a Draw!<br/>");      
      $(".reset").show(); 
      gameOver=true;
    }
  }
    
  $reset.click (function(){
    initiateGame();
  });
  
  function wipeBoard(){
    $1.text("");
    $2.text("");
    $3.text("");
    $4.text("");
    $5.text("");
    $6.text("");
    $7.text("");
    $8.text("");
    $9.text(""); 
  }
    
  function checkWinning(arr){
    var match;
      winning.forEach(function(winningCombo){
        match=0;
        arr.forEach(function(idCollected){
          if (winningCombo.indexOf(idCollected)!=-1){   match++;  }
        });
      if(match==3) {      
        $("h4").html("<br/>Player "+flip+" Wins!<br/>");     
        $(".reset").show();      
      }      
    });  
  } 

}); // Ends document.ready function