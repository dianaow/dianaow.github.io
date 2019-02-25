///////////// VARS ///////////////
var pageNum = 1;
var backButton = d3.select("#story-back");
var forwardButton = d3.select("#story-forward");
var pageNumbers = d3.select("#storymode-controls-numbers");
var storyHeader = d3.select("#storymode-header");
var storyContent = d3.select("#storymode-content p");

// STORIES //
var stories = [

  { title: "Singapore's Bus Ridership",
    description: "Passenger travel volume hour-by-hour from origin to destination bus stops in December 2018 is visualized here. \
    Volume is measured by summing the total arrivals and departures at the bus stop, aggregated for a month and grouped on an hourly basis. \
    To continue, click the arrows below.",
    time: 18,
    flyTo: {
      zoom: zoom,
      bounds: [lowerLong, lowerLat, upperLong, upperLat],
      bearing: -2.35,
      pitch: 50,
      speed: 0.3
    }
  },
  { title: "Morning Rush Hour",
    description: "Travel volume picks up starting from 7am, when Singapore's population begin their day. Boon Lay and Woodlands bus interchange is the busiest from 7 to 9am",
    time: 7,
    flyTo: {
      bounds: [lowerLong, lowerLat, upperLong, upperLat],
      minZoom: zoom,
      bearing:  -2.35,
      pitch: 50,
      speed: 0.3
    }
  },
  { title: "Heaviest Traffic",
    description: "Bus services are utilized at its fullest from 6pm-7pm. This coincides with time most of Singapore's working population depart from their workplaces. \
    Similarly, Boon Lay and Woodlands bus interchanges are the busiest from 6 to 8pm. \
    A passenger's daily travel routine would involve the same origin-destination bus stops, explaining why morning and evening rush-hour traffic are almost of the same volume",
    time: 18,
    flyTo: {
      bounds: [lowerLong, lowerLat, upperLong, upperLat],
      minZoom: zoom,
      bearing:  -2.35,
      pitch: 50,
      speed: 0.3
    }
  },
  { title: "Bus Interchanges",
    description: "Intuitively, from a summed arrivals and departures perspective, bus interchanges will have the highest total travel volume as it is the intersection point of most bus services. \
    Bus services start and end at bus interchanges. From a districts perspective, based on total travel volume, Woodlands is the epicenter of North region, Tampines Interchange for East, Boon Lay Interchange for West region.", 
    time: 18,
    showInt: true,
    flyTo: {
      bounds: [lowerLong, lowerLat, upperLong, upperLat],
      minZoom: zoom,
      bearing:  -2.35,
      pitch: 50,
      speed: 0.3
    }
  },
  { title: "After the Story...",
    description: "You may pan by dragging the map, or change the camera bearing and pitch by holding the Shift-key while using the arrow keys. \
    You may play an entire day's travel changes by clicking the 'Animate' button. \
    To hide the story pane and explore the data on your own, you may choose any of the selection on the sidebar.",
    time: 0,
    flyTo: {
      bounds: [lowerLong, lowerLat, upperLong, upperLat],
      minZoom: zoom,
      bearing:  -2.35,
      pitch: 50,
      speed: 0.3
    },

  }
];

///////////// FUNCTIONS ///////////////

function showStory() {
  showHourlyStats()
  d3.select("#storymode").style("opacity", 1)
  pageNum = 1
  pageNumbers.text(pageNum + " of " + stories.length);
  backButton.style( "visibility", (pageNum == 1) ? "hidden" : "visible" );
  forwardButton.style( "visibility", (pageNum == stories.length) ? "hidden" : "visible" );

  updateStory(stories[pageNum-1])
}

// Update Daytime.
function updateStoryDaytime(time){
  timeSelector.value = time
  setData()
  setTimeout(extrude, 100)

};

// Update Story.
function updateStory(storyObj) {
  
  // Story vars.
  var title = storyObj['title'];
  var description = storyObj['description'];
  var time = storyObj['time'];
  var newData = storyObj['newData'];
  var showInt = storyObj['showInt'];
  console.log(showInt)
  cameraSettings = storyObj['flyTo'];

  // Update the Storymode content.
  storyHeader.text(title);
  storyContent.text(description);

  // Update the time.
  updateStoryDaytime(time);
  timeValue.innerHTML = `${time}:00`

  // Update Camera.
  map.flyTo(cameraSettings);

  // Misc updates
  //if(showInt===true){
    //highlight()
  //} 

};


///////////// CALLBACKS ///////////////

// Story mode click through FORWARD.
backButton.on("click", function () {
  
  // Update the Navigation bottom panel.
  pageNum = pageNum - 1;
  pageNumbers.text(pageNum + " of " + stories.length);
  backButton.style( "visibility", (pageNum == 1) ? "hidden" : "visible" );
  forwardButton.style( "visibility", (pageNum == stories.length) ? "hidden" : "visible" );

  // Update the story.
  updateStory(stories[pageNum-1]);
});

// Story mode click through BACKWARD.
forwardButton.on("click", function () {
  
  // Update the Navigation bottom panel.
  pageNum = pageNum + 1;
  pageNumbers.text(pageNum + " of " + stories.length);
  backButton.style( "visibility", (pageNum == 1) ? "hidden" : "visible" );
  forwardButton.style( "visibility", (pageNum == stories.length) ? "hidden" : "visible" );

  // Update the story.
  updateStory(stories[pageNum-1]);
});

