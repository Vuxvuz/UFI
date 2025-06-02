classDiagram
    %% CONTROLLER LAYER
    class BaseController {
        #ApiResponse~T~ successResponse(T data, String message)
        #ResponseEntity handleException(Exception e)
    }
    
    class UserController {
        -UserService userService
        +ResponseEntity~ApiResponse~ register(RegisterDTO dto)
        +ResponseEntity~ApiResponse~ login(LoginDTO dto)
        +ResponseEntity~ApiResponse~ getUserInfo()
    }
    
    class WorkoutController {
        -WorkoutService workoutService
        +ResponseEntity~ApiResponse~ createWorkout(WorkoutDTO dto)
        +ResponseEntity~ApiResponse~ getWorkouts()
        +ResponseEntity~ApiResponse~ getWorkoutById(Long id)
    }
    
    class NutritionController {
        -NutritionService nutritionService
        +ResponseEntity~ApiResponse~ getNutritionAdvice(NutritionRequestDTO dto)
        +ResponseEntity~ApiResponse~ saveNutritionPlan(NutritionPlanDTO dto)
    }
    
    class ChatController {
        -ChatService chatService
        +ResponseEntity~ApiResponse~ sendMessage(MessageDTO dto)
        +ResponseEntity~ApiResponse~ getChatHistory(Long chatId)
    }
    
    %% DTO LAYER
    class ApiResponse~T~ {
        -String result
        -String message
        -T data
        +ApiResponse(String result, String message, T data)
    }
    
    class UserDTO {
        -Long id
        -String username
        -String email
    }
    
    class RegisterDTO {
        -String username
        -String email
        -String password
    }
    
    class LoginDTO {
        -String username
        -String password
    }
    
    class WorkoutDTO {
        -Long id
        -String title
        -List~ExerciseDTO~ exercises
        -LocalDateTime createdAt
    }
    
    class NutritionRequestDTO {
        -Double height
        -Double weight
        -String goal
        -String preferences
    }
    
    %% ENTITY LAYER
    class User {
        -Long id
        -String username
        -String email
        -String password
        -String role
        -LocalDateTime createdAt
    }
    
    class Workout {
        -Long id
        -String title
        -String description
        -User user
        -List~Exercise~ exercises
        -LocalDateTime createdAt
    }
    
    class Exercise {
        -Long id
        -String name
        -String description
        -Integer sets
        -Integer reps
        -Workout workout
    }
    
    class NutritionPlan {
        -Long id
        -String title
        -String content
        -User user
        -LocalDateTime createdAt
    }
    
    class ChatMessage {
        -Long id
        -String content
        -User user
        -Long chatId
        -LocalDateTime timestamp
    }
    
    %% EXCEPTION LAYER
    class GlobalExceptionHandler {
        +ResponseEntity~ApiResponse~ errorResponseEntity(String message, HttpStatus status)
        +ResponseEntity~ApiResponse~ handleIllegalArgumentException(IllegalArgumentException ex)
    }
    
    class ResourceNotFoundException {
        -String resourceName
        -String fieldName
        -Object fieldValue
        +ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue)
    }
    
    class AuthenticationException {
        -String message
        +AuthenticationException(String message)
    }
    
    %% REPOSITORY LAYER
    class UserRepository {
        +Optional~User~ findByUsername(String username)
        +Optional~User~ findByEmail(String email)
        +Boolean existsByUsername(String username)
        +Boolean existsByEmail(String email)
    }
    
    class WorkoutRepository {
        +List~Workout~ findByUserId(Long userId)
        +Optional~Workout~ findByIdAndUserId(Long id, Long userId)
    }
    
    class NutritionPlanRepository {
        +List~NutritionPlan~ findByUserId(Long userId)
        +Optional~NutritionPlan~ findByIdAndUserId(Long id, Long userId)
    }
    
    class ChatMessageRepository {
        +List~ChatMessage~ findByChatIdOrderByTimestampAsc(Long chatId)
        +void saveChatMessage(ChatMessage message)
    }
    
    %% SECURITY LAYER
    class JwtTokenProvider {
        -String secretKey
        -long validityInMilliseconds
        +String createToken(String username, List~String~ roles)
        +Authentication getAuthentication(String token)
        +String getUsername(String token)
        +boolean validateToken(String token)
    }
    
    class SecurityConfig {
        -UserDetailsService userDetailsService
        -JwtTokenProvider jwtTokenProvider
        +SecurityFilterChain filterChain(HttpSecurity http)
        +PasswordEncoder passwordEncoder()
    }
    
    class JwtAuthenticationFilter {
        -JwtTokenProvider jwtTokenProvider
        +void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
    }
    
    %% SERVICE LAYER
    class UserService {
        -UserRepository userRepository
        -PasswordEncoder passwordEncoder
        -JwtTokenProvider jwtTokenProvider
        +UserDTO register(RegisterDTO dto)
        +String login(LoginDTO dto)
        +UserDTO getCurrentUser()
    }
    
    class WorkoutService {
        -WorkoutRepository workoutRepository
        -UserService userService
        +WorkoutDTO createWorkout(WorkoutDTO dto)
        +List~WorkoutDTO~ getUserWorkouts()
        +WorkoutDTO getWorkoutById(Long id)
    }
    
    class NutritionService {
        -NutritionPlanRepository nutritionPlanRepository
        -UserService userService
        +NutritionAdviceDTO getNutritionAdvice(NutritionRequestDTO dto)
        +NutritionPlanDTO saveNutritionPlan(NutritionPlanDTO dto)
    }
    
    class ChatService {
        -ChatMessageRepository chatMessageRepository
        -UserService userService
        +MessageDTO sendMessage(MessageDTO dto)
        +List~MessageDTO~ getChatHistory(Long chatId)
    }
    
    %% RELATIONSHIPS
    BaseController <|-- UserController
    BaseController <|-- WorkoutController
    BaseController <|-- NutritionController
    BaseController <|-- ChatController
    
    UserController --> UserService
    WorkoutController --> WorkoutService
    NutritionController --> NutritionService
    ChatController --> ChatService
    
    UserService --> UserRepository
    UserService --> JwtTokenProvider
    WorkoutService --> WorkoutRepository
    WorkoutService --> UserService
    NutritionService --> NutritionPlanRepository
    NutritionService --> UserService
    ChatService --> ChatMessageRepository
    ChatService --> UserService
    
    UserRepository ..> User
    WorkoutRepository ..> Workout
    NutritionPlanRepository ..> NutritionPlan
    ChatMessageRepository ..> ChatMessage
    
    User "1" --> "many" Workout
    User "1" --> "many" NutritionPlan
    User "1" --> "many" ChatMessage
    Workout "1" --> "many" Exercise
    
    SecurityConfig --> JwtTokenProvider
    JwtAuthenticationFilter --> JwtTokenProvider