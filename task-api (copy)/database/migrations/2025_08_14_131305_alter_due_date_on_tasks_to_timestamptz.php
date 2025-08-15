<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Postgres: change type to timestamptz, keep nulls
        DB::statement("ALTER TABLE tasks ALTER COLUMN due_date TYPE timestamptz USING 
                       CASE 
                         WHEN due_date IS NULL THEN NULL
                         ELSE (due_date::timestamp AT TIME ZONE 'UTC')
                       END");
        DB::statement("ALTER TABLE tasks ALTER COLUMN due_date DROP NOT NULL"); // in case it was NOT NULL
    }

    public function down(): void
    {
        // revert to DATE (drops time info)
        DB::statement("ALTER TABLE tasks ALTER COLUMN due_date TYPE date USING due_date::date");
    }
};
