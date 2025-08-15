<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            // This sets up the foreign key relationship to the users table.
            // If a user is deleted, all of their tasks will also be deleted.
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable(); // nullable() makes it optional
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->date('due_date')->nullable(); // nullable() makes it optional
            $table->timestamps(); // Creates created_at and updated_at columns
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};