namespace CureTracker.Contracts.CoursesContracts
{
    public record CoursesListResponse(
        List<CourseResponse> Courses
    );
}
