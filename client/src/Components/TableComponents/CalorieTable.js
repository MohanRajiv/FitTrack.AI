import React from 'react';
import "./Table.css";
import { BsFillTrashFill, BsPencilFill} from "react-icons/bs";

function CalorieTable({rows, deleteRow, editRow}) {
    return (
        <div>
            <table className="Table">
                <thead>
                    <tr>
                        <th>Food</th>
                        <th>Protein</th>
                        <th>Fats</th>
                        <th>Carbs</th>
                        <th>Calories</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        rows.map((row, idx) => {
                            return <tr key = {idx}>
                                <td>{row.food_name}</td>
                                <td>{row.protein}</td>
                                <td>{row.fats}</td>
                                <td>{row.carbs}</td>
                                <td>{row.calories}</td>
                                <td>
                                    <span>
                                        <BsFillTrashFill className = "delete-btn" onClick={()=> deleteRow(idx)}/>
                                        <BsPencilFill onClick={() => editRow(idx)} />
                                    </span>
                                </td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    );
}

export default CalorieTable;
