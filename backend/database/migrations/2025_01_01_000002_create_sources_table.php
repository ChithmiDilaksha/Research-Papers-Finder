<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sources', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g. semantic_scholar, ieee, google_scholar
            $table->string('name'); // display name e.g. "IEEE Xplore"
            $table->text('description')->nullable();
            $table->boolean('requires_api_key')->default(false);
            $table->string('api_key_env')->nullable(); // e.g. IEEE_API_KEY
            $table->unsignedInteger('priority_weight')->default(10); // used in ranking score
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sources');
    }
};
