import { useState, useEffect } from "react";
import axiosClient from "../api/axios";

const statusToAccent = (s)=>{
  const v = (s||"pending").toLowerCase();
  if(v==="completed") return "completed";
  if(v==="in_progress") return "inprogress";
  if(v==="overdue") return "overdue";
  return "pending";
};

const getStatusColor = (status) => {
  const s = status?.toLowerCase();
  if(s === "completed") return "var(--success)";
  if(s === "in_progress") return "var(--info)";
  if(s === "overdue") return "var(--danger)";
  return "var(--warning)";
};

const formatDueDate = (dueDate) => {
  if (!dueDate) return null;
  
  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, type: 'overdue' };
  } else if (diffDays === 0) {
    return { text: 'Due today', type: 'today' };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', type: 'soon' };
  } else if (diffDays <= 3) {
    return { text: `Due in ${diffDays} days`, type: 'soon' };
  } else {
    return { text: `Due in ${diffDays} days`, type: 'normal' };
  }
};

const formatDateTime = (dueDate) => {
  if (!dueDate) return null;
  
  try {
    // Handle different timestamp formats
    let date;
    
    if (dueDate.includes('T') && dueDate.includes('Z')) {
      // UTC format: "2025-08-15T09:15:00.000000Z"
      date = new Date(dueDate);
    } else if (dueDate.includes('+')) {
      // Timezone format: "2025-08-15 13:45:00+04:30"
      const match = dueDate.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const [, year, month, day, hours, minutes] = match;
        date = new Date(year, month - 1, day, hours, minutes);
      }
    } else {
      // Fallback to regular date parsing
      date = new Date(dueDate);
    }
    
    if (!date || isNaN(date.getTime())) {
      return dueDate; // Return original string if parsing fails
    }
    
    // Format the date and time
    const dateStr = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${dateStr} at ${timeStr}`;
  } catch {
    // If there's any error parsing, return the original string
    return dueDate;
  }
};

export default function TaskItem({ task = {}, onDelete, onUpdate }){
  const id = task.id;
  const [isEditing,setIsEditing]=useState(false);
  const [editedTitle,setEditedTitle]=useState(task.title||"");
  const [editedDescription,setEditedDescription]=useState(task.description||"");
  const [editedStatus,setEditedStatus]=useState(task.status||"pending");
  const [editedDueDate,setEditedDueDate]=useState("");
  const [editedDueTime,setEditedDueTime]=useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Parse the combined due_date into separate date and time when editing
  useEffect(() => {
    if (task.due_date) {
      try {
        let date;
        
        if (task.due_date.includes('T') && task.due_date.includes('Z')) {
          // UTC format: "2025-08-15T09:15:00.000000Z"
          date = new Date(task.due_date);
        } else if (task.due_date.includes('+')) {
          // Timezone format: "2025-08-15 13:45:00+04:30"
          const match = task.due_date.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
          if (match) {
            const [, year, month, day, hours, minutes] = match;
            date = new Date(year, month - 1, day, hours, minutes);
          }
        } else {
          // Fallback to regular date parsing
          date = new Date(task.due_date);
        }
        
        if (date && !isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          setEditedDueDate(`${year}-${month}-${day}`);
          setEditedDueTime(`${hours}:${minutes}`);
        } else {
          setEditedDueDate("");
          setEditedDueTime("");
        }
      } catch {
        setEditedDueDate("");
        setEditedDueTime("");
      }
    } else {
      setEditedDueDate("");
      setEditedDueTime("");
    }
  }, [task.due_date]);

  const save = async ()=>{
    if (!editedTitle.trim()) return;
    
    setIsSaving(true);
    try{
      let dueDateTime = null;
      if (editedDueDate) {
        if (editedDueTime) {
          // Send raw values without any date object manipulation
          dueDateTime = `${editedDueDate} ${editedDueTime}:00`;
        } else {
          dueDateTime = `${editedDueDate} 23:59:00`;
        }
      }
      
      const res = await axiosClient.put(`/tasks/${id}`, {
        title: editedTitle, 
        description: editedDescription, 
        status: editedStatus,
        due_date: dueDateTime,
      });
      onUpdate && onUpdate(res.data);
      setIsEditing(false);
    }catch(e){
      console.error(e); 
      alert("Could not update task.");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async ()=>{
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try{ 
      await axiosClient.delete(`/tasks/${id}`); 
      onDelete && onDelete(id); 
    }catch(e){ 
      console.error(e); 
      alert("Could not delete task."); 
    }
  };

  const quickStatusChange = async (newStatus) => {
    try {
      const res = await axiosClient.put(`/tasks/${id}`, { status: newStatus });
      onUpdate && onUpdate(res.data);
    } catch (e) {
      console.error(e);
      alert("Could not update task status.");
    }
  };

  const accent = statusToAccent(task.status);
  const dueInfo = formatDueDate(task.due_date);
  
  return (
    <div className={`task card ${task.status === 'completed' ? 'completed' : ''}`}>
      <div className={`left-accent accent-${accent}`} />
      {isEditing ? (
        <div style={{flex:1, width: "100%"}}>
          <input 
            value={editedTitle} 
            onChange={e=>setEditedTitle(e.target.value)} 
            placeholder="Task title"
            style={{marginBottom: "12px"}}
          />
          <textarea 
            value={editedDescription} 
            onChange={e=>setEditedDescription(e.target.value)} 
            placeholder="Task description (optional)"
            rows="3"
            style={{marginBottom: "16px"}}
          />
          <div style={{
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "12px", 
            marginBottom: "16px"
          }}>
            <div>
              <label style={{
                display: "block", 
                marginBottom: "4px", 
                color: "var(--text-secondary)", 
                fontSize: "0.75rem",
                fontWeight: "500"
              }}>
                Due Date
              </label>
              <input 
                type="date" 
                value={editedDueDate} 
                onChange={e=>setEditedDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label style={{
                display: "block", 
                marginBottom: "4px", 
                color: "var(--text-secondary)", 
                fontSize: "0.75rem",
                fontWeight: "500"
              }}>
                Due Time
              </label>
              <input 
                type="time" 
                value={editedDueTime} 
                onChange={e=>setEditedDueTime(e.target.value)}
                min="00:00"
                max="23:59"
              />
            </div>
          </div>
          <div style={{display: "flex", gap: "12px", flexWrap: "wrap"}}>
            <select 
              value={editedStatus} 
              onChange={e=>setEditedStatus(e.target.value)}
              style={{flex: "1", minWidth: "140px"}}
            >
              <option value="pending">⏳ Pending</option>
              <option value="in_progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="overdue">🚨 Overdue</option>
            </select>
            <button 
              className="btn btn-primary" 
              onClick={save}
              disabled={isSaving || !editedTitle.trim()}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button 
              className="btn btn-ghost" 
              onClick={()=>{
                setIsEditing(false);
                setEditedTitle(task.title || "");
                setEditedDescription(task.description || "");
                setEditedStatus(task.status || "pending");
                setEditedDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "");
                setEditedDueTime(task.due_date ? new Date(task.due_date).toTimeString().slice(0, 5) : "");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="meta" style={{flex:1}}>
            <div style={{
              display: "flex", 
              gap: "12px", 
              alignItems: "center", 
              marginBottom: "8px",
              flexWrap: "wrap"
            }}>
              <h3 style={{margin: 0, flex: "1", minWidth: "200px"}}>{task.title}</h3>
              <span className="badge" style={{
                borderColor: getStatusColor(task.status),
                background: `${getStatusColor(task.status)}15`
              }}>
                <span className={`dot dot-${accent}`} />
                {String(task.status||"pending").replace("_"," ")}
              </span>
            </div>
            {task.description ? (
              <small style={{color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "8px", display: "block"}}>
                {task.description}
              </small>
            ) : (
              <small style={{color: "var(--muted)", fontStyle: "italic", marginBottom: "8px", display: "block"}}>
                No description provided
              </small>
            )}
            {task.due_date && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px"
              }}>
                {dueInfo && (
                  <span style={{
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: dueInfo.type === 'overdue' ? 'rgba(239, 68, 68, 0.2)' :
                               dueInfo.type === 'today' ? 'rgba(245, 158, 11, 0.2)' :
                               dueInfo.type === 'soon' ? 'rgba(59, 130, 246, 0.2)' :
                               'rgba(255, 255, 255, 0.1)',
                    color: dueInfo.type === 'overdue' ? '#fecaca' :
                           dueInfo.type === 'today' ? '#fef3c7' :
                           dueInfo.type === 'soon' ? '#dbeafe' :
                           'var(--muted)',
                    border: `1px solid ${
                      dueInfo.type === 'overdue' ? 'rgba(239, 68, 68, 0.3)' :
                      dueInfo.type === 'today' ? 'rgba(245, 158, 11, 0.3)' :
                      dueInfo.type === 'soon' ? 'rgba(245, 158, 11, 0.3)' :
                      'rgba(255, 255, 255, 0.1)'
                    }`
                  }}>
                    📅 {dueInfo.text}
                  </span>
                )}
                <span style={{
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  fontFamily: "monospace",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}>
                  📅 {formatDateTime(task.due_date)}
                </span>
              </div>
            )}
          </div>
          <div className="task-actions">
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "12px"
            }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => quickStatusChange('pending')}
                style={{
                  fontSize: "0.75rem",
                  padding: "6px 12px",
                  opacity: task.status === 'pending' ? 1 : 0.7
                }}
              >
                Pending
              </button>
              <button 
                className="btn btn-ghost" 
                onClick={() => quickStatusChange('in_progress')}
                style={{
                  fontSize: "0.75rem",
                  padding: "6px 12px",
                  opacity: task.status === 'pending' ? 1 : 0.7
                }}
              >
                In Progress
              </button>
              <button 
                className="btn btn-ghost" 
                onClick={() => quickStatusChange('completed')}
                style={{
                  fontSize: "0.75rem",
                  padding: "6px 12px",
                  opacity: task.status === 'completed' ? 1 : 0.7
                }}
              >
                ✅ Complete
              </button>
            </div>
            <div style={{display: "flex", gap: "8px"}}>
              <button 
                className="btn btn-ghost" 
                onClick={()=>setIsEditing(true)}
                style={{minWidth: "80px"}}
              >
                Edit
              </button>
              <button 
                className="btn btn-danger" 
                onClick={remove}
                style={{minWidth: "80px"}}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}