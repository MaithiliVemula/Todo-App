package com.example.todo;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for to-dos. The frontend (static/app.js) calls these endpoints with fetch().
 *
 *   GET    /api/todos              list all
 *   POST   /api/todos              create   body: {"title": "Buy milk"}
 *   PUT    /api/todos/{id}         update   body: {"title": "...", "completed": true}
 *   DELETE /api/todos/{id}         delete one
 *   DELETE /api/todos/completed    delete all completed
 */
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository repository;

    // Spring injects the repository automatically (constructor injection)
    public TodoController(TodoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Todo> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Todo create(@Valid @RequestBody Todo todo) {
        todo.setId(null);              // never trust an id sent by the client
        todo.setTitle(todo.getTitle().trim());
        return repository.save(todo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Todo> update(@PathVariable Long id, @Valid @RequestBody Todo changes) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setTitle(changes.getTitle().trim());
                    existing.setCompleted(changes.isCompleted());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/completed")
    @Transactional
    public ResponseEntity<Void> deleteCompleted() {
        repository.deleteByCompletedTrue();
        return ResponseEntity.noContent().build();
    }
}
