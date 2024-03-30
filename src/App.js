import { useEffect, useState } from "react";
import supabase from "./superbase";
import './App.css';

const gridCellClasses = ['grid-cell-elevator', 'grid-cell-source-dest', 'grid-cell-source', 'grid-cell-dest', 'grid-cell']

async function chooseElevator() {
  try {
    let elevators;
    let found = false
    do {
      const { data: fetchElevators, error } = await supabase.rpc('choose_elevator')
      if (fetchElevators.length !=0) {found = true; elevators = fetchElevators}
      if (found == false) await new Promise(r => setTimeout(r, 1500));
    } while(found == false)
    return elevators[0];
  } catch (error) {
    console.error('Error locking record:', error.message);
  }
}

async function updateElevator(elevatorId, currentFloor) {
    try {
      const { error } = await supabase
                      .from('elevator')
                      .update({ is_active: false , current_floor: currentFloor, last_released_at:  new Date().toISOString()})
                      .eq('id', elevatorId)
    } catch (error) {
      console.error('Error occured in updating table :', error.message);
    }
}

async function onboardElevator(elevatorId) {
  try {
    const { error } = await supabase
                    .from('elevator')
                    .update({last_onboarded_at:  new Date().toISOString()})
                    .eq('id', elevatorId)
  } catch (error) {
    console.error('Error occured in updating table :', error.message);
  }
}

function getGirdClassName(sourceValueChosen, destinationValueChosen, colIndex, rowIndexPlusOne, elevatorFloor, elevatorId) {
  if (rowIndexPlusOne == elevatorId && colIndex == elevatorFloor) {
    return gridCellClasses[0]
  }
  if( sourceValueChosen === colIndex && destinationValueChosen === colIndex) {
    return gridCellClasses[1]
  }
  if( sourceValueChosen === colIndex ) {
    return gridCellClasses[2]
  } else if (destinationValueChosen === colIndex) {
    return gridCellClasses[3]
  } else {
    return gridCellClasses[4]
  }
}

function App() {

  const warningMessage = "Source and Destination floor should not be same!"

  const [elevators, setElevators] = useState([]);
  const [sourceValueChosen, setSourceValueChosen] = useState('0');
  const [destinationValueChosen, setDestinationValueChosen] = useState('0')
  const [comment, setComment] = useState(warningMessage)
  const [display, setDisplay] = useState('')
  const [isOnboardButtonEnabled, setIsOnboardButtonEnabled] = useState(false);
  const [isFetchButtonEnabled, setIsFetchButtonEnabled] = useState(false);
  const [elevatorId, setElevatorId] = useState(null)
  const [elevatorLocation, setElevatorLocation] = useState(null)
  const [sourceSelectionEnabled, setSourceSelectionEnabled] = useState(true)
  const [destSelectionEnabled, setDestSelectionEnabled] = useState(true)
  const [grid, setGrid] = useState([]);
  const numberOfFloors = 12

  useEffect(function() {
    async function getElevators() {
      let { data: elevators, error } = await supabase
      .from('elevator')
      .select('*')

      const sortById = (a, b) => a.id - b.id;
      const sortedElevators = elevators.sort(sortById);

      setElevators(sortedElevators)
      console.log(sortedElevators)
      const initialGrid = Array.from({ length: sortedElevators.length }, () => Array.from({ length: numberOfFloors }, () => null));
      console.log(initialGrid)
      setGrid(initialGrid);
    }
    getElevators()
  }, [])

  const elevatorElements = []
  const sourceFloorsElements = []
  const destinationFloorsElements = []
  for (let i = 0; i < elevators.length; i++) {
    elevatorElements.push(<li key={i}>{elevators[i].id}</li>);
  }

  for (let i = 0; i < numberOfFloors; i++) {
    sourceFloorsElements.push(<option value={i} key={"source_floor_"+i}>{i}</option>)
  }

  for (let i = 0; i < numberOfFloors; i++) {
    destinationFloorsElements.push(<option value={i} key={"dest_floor_"+i}>{i}</option>)
  }

  const handleSelectSourceFloor = (event) => {
    const sourceValueChosen = event.target.value;
    setSourceValueChosen(sourceValueChosen)
    if (sourceValueChosen == destinationValueChosen) {
      setComment(warningMessage)
    } else {
      if(isOnboardButtonEnabled == false) setIsFetchButtonEnabled(true)
      setComment('')
    }
  };

  const handleSelectDestFloor = (event) => {
    const destinationValueChosen = event.target.value;
    setDestinationValueChosen(destinationValueChosen)
    if (sourceValueChosen == destinationValueChosen) {
      setComment(warningMessage)
    } else {
      if(isOnboardButtonEnabled == false) setIsFetchButtonEnabled(true)
      setComment('')
    }
  };

  const fetchElevator = async () => {
    setSourceSelectionEnabled(false)
    setIsFetchButtonEnabled(false)
    setIsOnboardButtonEnabled(false)
    let elevator = await chooseElevator()
    console.log(elevator)
    let id = elevator.f_id
    setElevatorId(id)
    let currentFloor = parseInt(sourceValueChosen)
    let destinationFloor = parseInt(destinationValueChosen)
    let elevatorFloor = elevator.f_current_floor
    setElevatorLocation(elevatorFloor)
    setDisplay("Elevator Id Chosen : " + id + ", " + "Elevator floor chosen : " + elevatorFloor)
    await new Promise(r => setTimeout(r, 1500));
    setDisplay("Elevator Id Chosen : " + id)
    const increment = elevatorFloor < currentFloor;
    for(let i = elevatorFloor; increment ? i < currentFloor : i > currentFloor; increment ? i++ : i-- ) {
      setDisplay("Elevator Id : " + id + ", " + "Elevator is at floor : " + i)
      setElevatorLocation(i)
      await new Promise(r => setTimeout(r, 1500));
    }
    setDisplay("Elevator Id : " + id + ", " + "Elevator is at floor : " + currentFloor)
    setElevatorLocation(currentFloor)
    setIsOnboardButtonEnabled(true)
  }

  const goDestination = async () => {
    setDestSelectionEnabled(false)
    setIsOnboardButtonEnabled(false)
    onboardElevator(elevatorId)
    let currentFloor = parseInt(sourceValueChosen)
    let destinationFloor = parseInt(destinationValueChosen)
    const increment = currentFloor < destinationFloor;
    for(let i = currentFloor; increment ? i < destinationFloor : i > destinationFloor; increment ? i++ : i-- ) {
      setDisplay("Elevator Id : " + elevatorId + ", " + "Elevator is at floor : " + i)
      setElevatorLocation(i)
      await new Promise(r => setTimeout(r, 1500));
    }
    
    setDisplay("Elevator Id : " + elevatorId + ", " + "Elevator is at floor : " + destinationFloor)
    setElevatorLocation(destinationFloor)
    await new Promise(r => setTimeout(r, 1500));
    await updateElevator(elevatorId, destinationFloor)
    setElevatorLocation(null)
    setIsFetchButtonEnabled(true)
    setDestSelectionEnabled(true)
    setSourceSelectionEnabled(true)
  }

  const findTheElevators = async () => {
    // Select elements by key and update their styles
    let { data: elevators, error } = await supabase
    .from('elevator')
    .select('*')

    const sortById = (a, b) => a.id - b.id;
    const sortedElevators = elevators.sort(sortById);

    elevators.forEach(elevator => {
      const elementToStyle = document.getElementById(elevator.current_floor+"~"+elevator.id);
      elementToStyle.style.borderColor = 'red';
      elementToStyle.style.borderWidth = '2px';
    });
  };

  const hideElevators = async () => {
    gridCellClasses.forEach(className => {
      const elementsToStyle = document.querySelectorAll("."+className);
      elementsToStyle.forEach(elementToStyle => {
        elementToStyle.style.borderColor = 'black';
        elementToStyle.style.borderWidth = '1px';
      })
    })
  }


  return (
    <div>
      <h1>Elevators</h1>
      <ul hidden>
        {elevatorElements}
      </ul>

      <div className="grid-container">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex+1} className="grid-row">
          {row.map((cell, colIndex) => (
            <div id={colIndex+"~"+(1+rowIndex)} key={colIndex+"~"+(1+rowIndex)} className={getGirdClassName(sourceValueChosen, destinationValueChosen, colIndex.toString(), (1+rowIndex), elevatorLocation, elevatorId)}>
              <span>{colIndex} </span>
            </div>
          ))}
        </div>
        ))}
      </div>

      <div className="selectFloor">
      <label for="source_floors">Choose a source floor: </label>
        <select className="floorSelection" id="source_floors" name="source_floors" onChange={handleSelectSourceFloor} disabled={!sourceSelectionEnabled}>
        {sourceFloorsElements}
        </select>
        <button className="fetchElevator" disabled={!isFetchButtonEnabled} onClick={fetchElevator}
        onMouseEnter={findTheElevators} onMouseLeave={hideElevators}
        >Fetch Elevator</button>
      </div>
      <div className="selectFloor">
        <label for="dest_floors">Choose a destination floor: </label>
        <select className="floorSelection" id="dest_floors" name="dest_floors" onChange={handleSelectDestFloor} disabled={!destSelectionEnabled}>
        {sourceFloorsElements}
        </select>
        
        <button className="onBoard" disabled={!isOnboardButtonEnabled} onClick={goDestination}>Onboard</button>
      </div>
        <br></br>
        <p hidden>
          {comment}
        </p>
        <p hidden>
          {display}
        </p>
    
    </div>
  );
}

export default App;
