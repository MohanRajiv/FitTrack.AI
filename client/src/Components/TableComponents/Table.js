import React from 'react';
import "./Table.css";
import { BsFillTrashFill, BsPencilFill} from "react-icons/bs";

function Table( {rows, deleteRow, editRow}) {
    return (
        <div>
            <table className="Table">
                <thead>
                    <tr>
                        <th>Weight</th>
                        <th>Reps</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        rows.map((row, idx) => {
                            return <tr key = {idx}>
                                <td>{row.weight}</td>
                                <td>{row.reps}</td>
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

export default Table;
