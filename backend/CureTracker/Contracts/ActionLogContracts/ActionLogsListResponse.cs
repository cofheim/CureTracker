namespace CureTracker.Contracts.ActionLogContracts
{
    public record ActionLogsListResponse(
        List<ActionLogResponse> Logs,
        int TotalCount,
        int Page,
        int PageSize,
        int TotalPages
    );
}
