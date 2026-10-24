package com.example.todo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data writes the SQL for us. Just by extending JpaRepository we get
 * save(), findById(), findAll(), deleteById() and more for free.
 */
public interface TodoRepository extends JpaRepository<Todo, Long> {

    // Spring builds the query from the method name: ORDER BY created_at DESC
    List<Todo> findAllByOrderByCreatedAtDesc();

    void deleteByCompletedTrue();
}
