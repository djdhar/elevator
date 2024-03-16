import { useEffect, useState } from "react";
import supabase from "./superbase";
function App() {

  const warningMessage = "Source and Destination floor should not be same!"

  const [elevators, setElevators] = useState([]);
  const [sourceValueChosen, setSourceValueChosen] = useState('0');
  const [destinationValueChosen, setDestinationValueChosen] = useState('0')
  const [comment, setComment] = useState(warningMessage)
  const numberOfFloors = 12

  useEffect(function() {
    async function getElevators() {
      let { data: elevators, error } = await supabase
      .from('elevator')
      .select('*')
      setElevators(elevators)
      console.log(elevators)
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
      setComment('Same Value of Source and Destination can not be chosen!')
    } else {
      setComment('')
    }
  };

  const handleSelectDestFloor = (event) => {
    const destinationValueChosen = event.target.value;
    setDestinationValueChosen(destinationValueChosen)
    if (sourceValueChosen == destinationValueChosen) {
      setComment('Same Value of Source and Destination can not be chosen!')
    } else {
      setComment('')
    }
  };

  return (
    <div>
      <h1>Elevators</h1>
      <ul>
        {elevatorElements}
      </ul>

      <label for="source_floors">Choose a source floor: </label>
        <select id="source_floors" name="source_floors" onChange={handleSelectSourceFloor}>
        {sourceFloorsElements}
        </select>
        <br></br>
        <label for="dest_floors">Choose a destination floor: </label>
        <select id="dest_floors" name="dest_floors" onChange={handleSelectDestFloor}>
        {sourceFloorsElements}
        </select>
        <br></br>
        <p>
          {comment}
        </p>
    <button>Fetch Elevator</button>
    </div>
  );
}

export default App;
