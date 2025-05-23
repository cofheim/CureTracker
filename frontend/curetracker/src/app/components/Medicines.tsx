import { MedicineName } from "./MedicineName";
import Button from "antd/es/button/button";
import { Card } from "antd";
import { Medicine } from "../models/Medicine";

interface Props {
    medicines: Medicine[];
    handleDelete: (id:string) => void;
    handleOpen: (medicine: Medicine) => void;
}

export const Medicines = ({medicines, handleDelete, handleOpen} : Props) => {
    return (
        <div className="cards">
            {medicines.map((medicine : Medicine) => (
                <Card 
                    key={medicine.id} 
                    title={<MedicineName name={medicine.name}/>} 
                    variant="borderless"
                >
                    <p>{medicine.description}</p>
                    <div className="card_buttons">
                        <Button 
                        onClick={() => handleOpen(medicine)}
                        style={{flex: 1}}
                        >
                            Edit
                        </Button>
                        <Button 
                        onClick={() => handleDelete(medicine.id)}
                        danger
                        style={{flex:1}}
                        >
                            Delete
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
