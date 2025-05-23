interface Props {
    name: string;
}

export const MedicineName = ({name} : Props) => {
    return (
       <div style={{
        display: "flex",
        flexDirection:"column",
        alignItems: "center",
        justifyContent: "space-between",
       }}>
        <p className="card_name">{name}</p>
        </div>
    );
}
