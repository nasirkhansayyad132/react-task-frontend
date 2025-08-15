<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    // List all tasks for the logged-in user
    public function index()
    {
        // Auth::user() gets the currently authenticated user.
        // We use the 'tasks' relationship we defined in the User model.
        $tasks = Auth::user()->tasks()->orderBy('created_at', 'desc')->get();
        return response()->json($tasks);
    }

    // Create a new task
    // app/Http/Controllers/Api/TaskController.php

public function store(\Illuminate\Http\Request $r) {
    $data = $r->validate([
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'status' => 'nullable|in:pending,in_progress,completed,overdue',
        'due_date' => 'nullable|date' // accepts date or date-time
    ]);
    $task = $r->user()->tasks()->create($data);
    return response()->json($task, 201);
}

public function update(\Illuminate\Http\Request $r, \App\Models\Task $task) {
    $data = $r->validate([
        'title' => 'sometimes|required|string|max:255',
        'description' => 'nullable|string',
        'status' => 'nullable|in:pending,in_progress,completed,overdue',
        'due_date' => 'nullable|date'
    ]);
    $task->update($data);
    return $task;
}


    // Show a single task
    public function show(Task $task)
    {
        // Authorization: Check if the logged-in user owns this task
        if (Auth::id() !== $task->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($task);
    }

    // Update a task
    // public function update(Request $request, Task $task)
    // {
    //     // Authorization: Check if the logged-in user owns this task
    //     if (Auth::id() !== $task->user_id) {
    //         return response()->json(['message' => 'Unauthorized'], 403);
    //     }
        
    //     $validated = $request->validate([
    //         'title' => 'sometimes|required|string|max:255',
    //         'description' => 'nullable|string',
    //         'status' => 'sometimes|in:pending,in_progress,completed',
    //         'due_date' => 'nullable|date',
    //     ]);

    //     $task->update($validated);

    //     return response()->json($task);
    // }

    // Delete a task
    public function destroy(Task $task)
    {
        // Authorization: Check if the logged-in user owns this task
        if (Auth::id() !== $task->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $task->delete();

        return response()->json(null, 204); // 204 No Content
    }
}