import {NextRequest, NextResponse} from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {companyUrl} = body;

    // Validate that companyUrl is provided
    if (!companyUrl) {
      return NextResponse.json(
        {error: 'Company URL is required'},
        {status: 400},
      );
    }

    // TODO: Add actual project creation logic here
    // For now, generate a mock project ID
    const projectId = `project-${Date.now()}`;

    // In a real implementation, you would:
    // 1. Parse the company URL to extract company info
    // 2. Create a new project record in the database
    // 3. Return the created project ID

    return NextResponse.json(
      {projectId},
      {status: 201},
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      {error: 'Failed to create project'},
      {status: 500},
    );
  }
}
