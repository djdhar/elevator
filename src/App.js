import { useEffect, useState } from "react";
import supabase from "./superbase";
import './App.css';

async function chooseElevator() {
  try {
    let elevators;
    let found = false
    do {
      const { data: fetchElevators, error } = await supabase.rpc('choose_elevator')
      if (fetchElevators.length !=0) {found = true; elevators = fetchElevators}
      if (found == false) await new Promise(r => setTimeout(r, 2000));
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
                      .update({ is_active: false , current_floor: currentFloor})
                      .eq('id', elevatorId)
    } catch (error) {
      console.error('Error occured in updating table :', error.message);
    }
}

function getGirdClassName(sourceValueChosen, destinationValueChosen, colIndex) {
  if( sourceValueChosen === colIndex && destinationValueChosen === colIndex) {
    return 'grid-cell-source-dest'
  }
  if( sourceValueChosen === colIndex ) {
    return 'grid-cell-source'
  } else if (destinationValueChosen === colIndex) {
    return 'grid-cell-dest'
  } else {
    return 'grid-cell'
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
      setIsFetchButtonEnabled(true)
      setComment('')
    }
  };

  const handleSelectDestFloor = (event) => {
    const destinationValueChosen = event.target.value;
    setDestinationValueChosen(destinationValueChosen)
    if (sourceValueChosen == destinationValueChosen) {
      setComment(warningMessage)
    } else {
      setIsFetchButtonEnabled(true)
      setComment('')
    }
  };

  const fetchElevator = async () => {
    setSourceSelectionEnabled(false)
    setIsFetchButtonEnabled(false)
    let elevator = await chooseElevator()
    console.log(elevator)
    let id = elevator.f_id
    let currentFloor = parseInt(sourceValueChosen)
    let destinationFloor = parseInt(destinationValueChosen)
    let elevatorFloor = elevator.f_current_floor
    setDisplay("Elevator Id Chosen : " + id + ", " + "Elevator floor chosen : " + elevatorFloor)
    await new Promise(r => setTimeout(r, 2000));
    setDisplay("Elevator Id Chosen : " + id)
    const increment = elevatorFloor < currentFloor;
    for(let i = elevatorFloor; increment ? i < currentFloor : i > currentFloor; increment ? i++ : i-- ) {
      setDisplay("Elevator Id : " + id + ", " + "Elevator is at floor : " + i)
      await new Promise(r => setTimeout(r, 2000));
    }
    setDisplay("Elevator Id : " + id + ", " + "Elevator is at floor : " + currentFloor)
    setElevatorId(id)
    setIsOnboardButtonEnabled(true)
  }

  const goDestination = async () => {
    setDestSelectionEnabled(false)
    setIsOnboardButtonEnabled(false)
    let currentFloor = parseInt(sourceValueChosen)
    let destinationFloor = parseInt(destinationValueChosen)
    const increment = currentFloor < destinationFloor;
    for(let i = currentFloor; increment ? i < destinationFloor : i > destinationFloor; increment ? i++ : i-- ) {
      setDisplay("Elevator Id : " + elevatorId + ", " + "Elevator is at floor : " + i)
      await new Promise(r => setTimeout(r, 2000));
    }
    setDisplay("Elevator Id : " + elevatorId + ", " + "Elevator is at floor : " + destinationFloor)
    await updateElevator(elevatorId, destinationFloor)
    setIsFetchButtonEnabled(true)
    setDestSelectionEnabled(true)
    setSourceSelectionEnabled(true)
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
            <div key={colIndex} className={getGirdClassName(sourceValueChosen, destinationValueChosen, colIndex.toString())}>
              <span> {rowIndex+1} {colIndex} </span>
            </div>
          ))}
        </div>
        ))}
      </div>

      <label for="source_floors">Choose a source floor: </label>
        <select id="source_floors" name="source_floors" onChange={handleSelectSourceFloor} disabled={!sourceSelectionEnabled}>
        {sourceFloorsElements}
        </select>
        <br></br>
        <label for="dest_floors">Choose a destination floor: </label>
        <select id="dest_floors" name="dest_floors" onChange={handleSelectDestFloor} disabled={!destSelectionEnabled}>
        {sourceFloorsElements}
        </select>
        <br></br>
        <p>
          {comment}
        </p>
        <p>
          {display}
        </p>
    <button disabled={!isFetchButtonEnabled} onClick={fetchElevator}>Fetch Elevator</button>
    <button disabled={!isOnboardButtonEnabled} onClick={goDestination}>Onboard?</button>
    </div>
  );
}

export default App;
