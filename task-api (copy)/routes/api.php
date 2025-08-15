<?php
namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TaskController;

// Public routes (no authentication needed)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (authentication required)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // This single line creates all the standard CRUD routes for tasks:
    // GET /api/tasks -> index()
    // POST /api/tasks -> store()
    // GET /api/tasks/{task} -> show()
    // PUT/PATCH /api/tasks/{task} -> update()
    // DELETE /api/tasks/{task} -> destroy()
    Route::apiResource('tasks', TaskController::class);
});