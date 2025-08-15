import { useState, useEffect } from "react";
import axiosClient from "../api/axios";
import TaskItem from "../components/TaskItem";

export default function Dashboard(){
  const [tasks,setTasks]=useState([]);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [dueDate,setDueDate]=useState("");
  const [dueTime,setDueTime]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  useEffect(()=>{
    axiosClient.get("/tasks")
      .then(r=>{ 
        console.log('API Response - All tasks:', r.data);
        console.log('API Response - Task count:', r.data.length);
        console.log('API Response - User IDs:', r.data.map(t => ({ id: t.id, user_id: t.user_id, title: t.title })));
        setTasks(r.data); 
        setLoading(false); 
        // Wait for components to render, then check overdue
        setTimeout(() => {
          console.log('Running overdue check after tasks loaded and rendered');
          checkOverdueTasks();
        }, 1500); // Wait 1.5 seconds for full render
      })
      .catch((err) => {
        console.error('Failed to fetch tasks:', err);
        setError("Could not fetch tasks."); 
        setLoading(false); 
      });
  },[]);

  // Check for overdue tasks every minute for continuous monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if (tasks.length > 0) {
        checkOverdueTasks();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks.length]);

  // Periodic refresh to keep frontend and backend in sync
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!loading && tasks.length > 0) {
        console.log('Periodic refresh to sync with server');
        axiosClient.get("/tasks")
          .then(r => {
            // Only update if there are actual changes
            if (JSON.stringify(r.data) !== JSON.stringify(tasks)) {
              console.log('Tasks changed on server, updating frontend');
              setTasks(r.data);
            }
          })
          .catch(err => {
            console.error('Periodic refresh failed:', err);
          });
      }
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [loading, tasks.length]);

  const checkOverdueTasks = () => {
    const now = new Date();
    console.log('Checking overdue tasks at:', now.toLocaleString());
    console.log('Current time object:', now);
    console.log('Total tasks:', tasks.length);
    console.log('Tasks:', tasks);
    
    const updatedTasks = tasks.map(task => {
      console.log(`\n--- Checking task: "${task.title}" ---`);
      console.log('Task due_date:', task.due_date);
      console.log('Task status:', task.status);
      
      if (task.due_date && task.status !== 'completed') {
        try {
          let dueDateTime;
          
          if (task.due_date.includes('T') && task.due_date.includes('Z')) {
            // UTC format: "2025-08-15T09:15:00.000000Z"
            dueDateTime = new Date(task.due_date);
          } else if (task.due_date.includes('+')) {
            // Timezone format: "2025-08-15 13:45:00+04:30"
            const match = task.due_date.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
            if (match) {
              const [, year, month, day, hours, minutes] = match;
              dueDateTime = new Date(year, month - 1, day, hours, minutes);
            }
          } else {
            // Fallback to regular date parsing
            dueDateTime = new Date(task.due_date);
          }
          
          if (dueDateTime && !isNaN(dueDateTime.getTime())) {
            console.log(`Task "${task.title}": due ${dueDateTime.toLocaleString()}, now: ${now.toLocaleString()}, overdue: ${dueDateTime < now}`);
            
            if (dueDateTime < now && task.status !== 'overdue') {
              console.log(`Marking task "${task.title}" as overdue`);
              return { ...task, status: 'overdue' };
            }
          }
        } catch (error) {
          console.error('Error parsing due date:', error);
        }
      } else {
        console.log('Skipping task - no due_date or already completed');
      }
      return task;
    });
    
    // Only update if there are changes
    if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
      console.log('Updating tasks with overdue status');
      
      // Update local state first
      setTasks(updatedTasks);
      
      // Update tasks on server (but don't let failures corrupt local state)
      updatedTasks.forEach(task => {
        if (task.status === 'overdue') {
          axiosClient.put(`/tasks/${task.id}`, { status: 'overdue' })
            .then(() => {
              console.log(`Successfully updated task "${task.title}" to overdue on server`);
            })
            .catch((error) => {
              console.error(`Failed to update task "${task.title}" to overdue on server:`, error);
              // Revert the local status change if server update fails
              setTasks(currentTasks => 
                currentTasks.map(t => 
                  t.id === task.id ? { ...t, status: 'pending' } : t
                )
              );
            });
        }
      });
    } else {
      console.log('No overdue tasks found');
    }
  };

  const handleAddTask = async (e)=>{
    e.preventDefault();
    try{
      let dueDateTime = null;
      if (dueDate) {
        if (dueTime) {
          console.log('=== TIME DEBUGGING ===');
          console.log('Input dueDate:', dueDate);
          console.log('Input dueTime:', dueTime);
          
          // Send raw values without any date object manipulation
          dueDateTime = `${dueDate} ${dueTime}:00`;
          console.log('Final dueDateTime string (raw):', dueDateTime);
          console.log('=== END TIME DEBUGGING ===');
        } else {
          dueDateTime = `${dueDate} 23:59:00`;
        }
      }
      
      const taskData = { 
        title, 
        description, 
        due_date: dueDateTime,
        // Add a flag to tell backend this is local time
        timezone: 'local'
      };
      
      console.log('Sending task data to backend:', taskData);
      const res = await axiosClient.post("/tasks", taskData);
      console.log('Backend response:', res.data);
      console.log('Backend due_date:', res.data.due_date);
      
      setTasks([res.data, ...tasks]);
      setTitle(""); 
      setDescription(""); 
      setDueDate(""); 
      setDueTime("");
    }catch{ setError("Failed to add task."); }
  };

  const handleDeleteTask = (id) => {
    setTasks(currentTasks => currentTasks.filter(t => t.id !== id));
    console.log(`Task ${id} removed from UI after successful deletion.`);
  };
  

  const handleUpdateTask = (updated)=> setTasks(tasks.map(t=>t.id===updated.id?updated:t));

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0
    };
    tasks.forEach(task => {
      counts[task.status || 'pending']++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="container">
      <h1 className="h1">Task Management Dashboard</h1>
      <p style={{textAlign: "center", color: "var(--muted)", marginBottom: "32px", fontSize: "1.125rem"}}>
        Organize your work and stay on top of your priorities
      </p>

      {/* Status Summary */}
      <div className="card" style={{padding: "24px", marginBottom: "32px"}}>
        <h3 style={{margin: "0 0 20px", fontSize: "1.25rem", fontWeight: "600", color: "var(--text)"}}>
          Task Overview
        </h3>
        <div style={{
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
          gap: "16px"
        }}>
          <div style={{textAlign: "center", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px"}}>
            <div style={{fontSize: "2rem", fontWeight: "700", color: "var(--warning)"}}>{statusCounts.pending}</div>
            <div style={{color: "var(--muted)", fontSize: "0.875rem"}}>Pending</div>
          </div>
          <div style={{textAlign: "center", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px"}}>
            <div style={{fontSize: "2rem", fontWeight: "700", color: "var(--info)"}}>{statusCounts.in_progress}</div>
            <div style={{color: "var(--muted)", fontSize: "0.875rem"}}>In Progress</div>
          </div>
          <div style={{textAlign: "center", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px"}}>
            <div style={{fontSize: "2rem", fontWeight: "700", color: "var(--success)"}}>{statusCounts.completed}</div>
            <div style={{color: "var(--muted)", fontSize: "0.875rem"}}>Completed</div>
          </div>
          <div style={{textAlign: "center", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px"}}>
            <div style={{fontSize: "2rem", fontWeight: "700", color: "var(--danger)"}}>{statusCounts.overdue}</div>
            <div style={{color: "var(--muted)", fontSize: "0.875rem"}}>Overdue</div>
          </div>
        </div>
      </div>

      <div className="card form-card">
        <h3 style={{margin: "0 0 20px", fontSize: "1.25rem", fontWeight: "600", color: "var(--text)"}}>
          Add New Task
        </h3>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleAddTask} className="row">
          <input 
            placeholder="What needs to be done?" 
            value={title} 
            onChange={e=>setTitle(e.target.value)} 
            required 
          />
          <textarea 
            placeholder="Add a description (optional)" 
            value={description} 
            onChange={e=>setDescription(e.target.value)}
            rows="3"
          />
          <div style={{
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "16px"
          }}>
            <div>
              <label style={{
                display: "block", 
                marginBottom: "8px", 
                color: "var(--text-secondary)", 
                fontSize: "0.875rem",
                fontWeight: "500"
              }}>
                Due Date
              </label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e=>setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label style={{
                display: "block", 
                marginBottom: "8px", 
                color: "var(--text-secondary)", 
                fontSize: "0.875rem",
                fontWeight: "500"
              }}>
                Due Time
              </label>
              <input 
                type="time" 
                value={dueTime} 
                onChange={e=>setDueTime(e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Add Task</button>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={()=>{
                setTitle("");setDescription("");setDueDate("");setDueTime("");
              }}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="card loading">Loading your tasks...</div>
      ) : (
        <div className="task-list">
          {tasks.length ? (
            <>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
                <h3 style={{margin: 0, fontSize: "1.25rem", fontWeight: "600", color: "var(--text)"}}>
                  Your Tasks ({tasks.length})
                </h3>
                <span style={{color: "var(--muted)", fontSize: "0.875rem"}}>
                  {statusCounts.completed} completed
                </span>
              </div>
              {tasks.map(t=>(
                <TaskItem key={t.id} task={t} onDelete={handleDeleteTask} onUpdate={handleUpdateTask}/>
              ))}
            </>
          ) : (
            <div className="card" style={{
              padding: "60px 40px", 
              textAlign: "center", 
              color: "var(--muted)",
              background: "rgba(255, 255, 255, 0.02)"
            }}>
              <div style={{fontSize: "3rem", marginBottom: "16px", opacity: "0.5"}}>📝</div>
              <h3 style={{margin: "0 0 12px", color: "var(--text)", fontSize: "1.25rem"}}>No tasks yet</h3>
              <p style={{margin: 0, fontSize: "1rem"}}>Create your first task above to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
